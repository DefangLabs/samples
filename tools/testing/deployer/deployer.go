package deployer

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"defang.io/tools/testing/detector"
	"defang.io/tools/testing/logger"
	"defang.io/tools/testing/login"
	"defang.io/tools/testing/test"
	"github.com/DefangLabs/defang/src/pkg"
	"github.com/DefangLabs/defang/src/pkg/types"
)

type TestEnvironment struct {
	TenantId        types.TenantID
	Cluster         string
	ComposeFilePath string
	WorkDir         string

	accessToken string
}

func (t *TestEnvironment) SetComposeFilePath(path string) { t.ComposeFilePath = path }
func (t *TestEnvironment) SetWorkDir(path string)         { t.WorkDir = path }

type CliDeployer struct {
	*TestEnvironment
	Id                   int
	Stdout, Stderr, Logs bytes.Buffer
	Logger               logger.Logger

	StateDir string
	EnvVars  []string
	Configs  []string

	HasSetup    bool
	HasDeployed bool
}

func New(ctx context.Context, id int, tokenIssuer *login.TokenIssuer, cluster string, tenantId types.TenantID) (*CliDeployer, error) {
	if !strings.HasSuffix(cluster, ":443") {
		cluster += ":443"
	}

	accessToken, err := tokenIssuer.Login(ctx, tenantId)
	if err != nil {
		return nil, fmt.Errorf("failed to login to cluster %v with tenantId %v: %w", cluster, tenantId, err)
	}

	testEnv := &TestEnvironment{
		TenantId:    tenantId,
		Cluster:     cluster,
		accessToken: accessToken,
	}

	d := &CliDeployer{
		Id:              id,
		TestEnvironment: testEnv,
	}
	d.Logger = log.New(&d.Logs, "", log.LstdFlags)

	return d, err
}

func (d *CliDeployer) Setup(ctx context.Context) error {
	// Create the state file to override the anonID to be "loadtest"
	tmpDir, err := os.MkdirTemp("", "loadtest")
	if err != nil {
		return fmt.Errorf("failed to create temp dir %v: %w", tmpDir, err)
	}
	stateDir := filepath.Join(tmpDir, "defang")
	os.MkdirAll(stateDir, 0755)
	os.WriteFile(filepath.Join(stateDir, "state.json"), []byte(`{"AnonID":"loadtest"}`), 0644)
	d.StateDir = tmpDir

	d.EnvVars = []string{
		"DEFANG_ACCESS_TOKEN=" + d.accessToken,
		"DEFANG_FABRIC=" + d.Cluster,
		"XDG_STATE_HOME=" + tmpDir,
		"DEFANG_DISABLE_ANALYTICS=true",
	}

	// Agree to defang tos
	if _, err := d.RunCommand(ctx, nil, "defang", "terms", "--agree-tos"); err != nil {
		return fmt.Errorf("failed to agree to terms: %w", err)
	}
	d.HasSetup = true
	return nil
}

func (d *CliDeployer) Deploy(ctx context.Context) error {
	if err := d.SetConfigs(ctx, io.Discard, io.Discard, log.Default()); err != nil {
		return err
	}

	if !d.HasSetup {
		if err := d.Setup(ctx); err != nil {
			return fmt.Errorf("failed to setup deployer: %w", err)
		}
	}
	// Start compose up
	d.HasDeployed = true
	args := []string{"compose", "up"}
	if d.ComposeFilePath != "" {
		args = append(args, "-f", d.ComposeFilePath)
	}
	_, err := d.RunCommand(ctx, nil, "defang", args...)
	return err
}

var urlRegex = regexp.MustCompile(`DEPLOYMENT_COMPLETED\s+(\S+)\s+(\S+)`)
var internalURLRegex = regexp.MustCompile(`\.internal:\d+$`)

func findUrlsInOutput(output string) []string {
	var urls []string
	match := urlRegex.FindAllStringSubmatch(output, -1)
	for _, m := range match {
		if len(m) < 3 || m[2] == "" {
			continue
		}
		if internalURLRegex.MatchString(m[2]) {
			log.Printf("Skipping internal URL %v", m[2])
			continue
		}
		// Check if the URL starts with a scheme (http, https, etc.)
		if strings.HasPrefix(m[2], "https://") {
			urls = append(urls, m[2])
		}
	}
	return urls
}

func (d *CliDeployer) RunDeployTest(ctx context.Context, t test.TestInfo) (*test.ItemResult, error) {
	log := d.Logger
	if t.Logger != nil {
		log = logger.NewMultiLogger(d.Logger, t.Logger)
	}
	log.Printf("Running test %v at %v as tenant %v by deployer %v", t.Name, t.Folder, d.TenantId, d.Id)

	d.WorkDir = t.Folder
	result := &test.ItemResult{
		Name:            t.Name,
		DeploySucceeded: false,
		ServiceOnline:   false,
		ServiceHealthy:  false,
	}

	if err := d.SetConfigs(ctx, t.Stdout, t.Stderr, log); err != nil {
		result.Message = fmt.Sprintf("Failed to set configs: %v", err)
		log.Printf("failed to set configs: %v", err)
		return result, err
	}

	cmdCtx, cancelCmd := context.WithCancel(ctx)
	defer cancelCmd()

	detector := &detector.StringDetector{
		Target: "! failed to wait for service status:",
		Callback: func() {
			log.Println("Failed to wait for service status detected, command will not stop by itself, stopping the command in 3 seconds")
			test.SleepWithContext(ctx, 3*time.Second)
			cancelCmd()
		},
	}

	d.HasDeployed = true
	start := time.Now()
	cmd, err := d.RunCommand(cmdCtx, func(cmd *exec.Cmd) {
		if t.Stdout != nil {
			cmd.Stdout = io.MultiWriter(&d.Stdout, t.Stdout, detector)
		} else {
			cmd.Stdout = io.MultiWriter(&d.Stdout, detector)
		}
		if t.Stderr != nil {
			cmd.Stderr = io.MultiWriter(&d.Stderr, t.Stderr, detector)
		} else {
			cmd.Stderr = io.MultiWriter(&d.Stderr, detector)
		}
		cmd.Cancel = func() error {
			return cmd.Process.Signal(os.Interrupt) // Use interrupt signal to stop the command when context is cancelled
		}

	}, "defang", "compose", "up", "--verbose", "--debug")
	if err != nil {
		var exitErr *exec.ExitError
		if errors.As(err, &exitErr) {
			log.Printf("Command exited with error: %v", exitErr)
			result.Message = fmt.Sprintf("Command exited: %v", exitErr)
		} else {
			log.Printf("Command run failed with error: %v", err)
		}
	}
	result.Duration = time.Since(start)

	if cmd.ProcessState != nil {
		result.DeploySucceeded = cmd.ProcessState.Success()
	}

	urls := findUrlsInOutput(d.Stdout.String())
	if len(urls) == 0 {
		result.Message = "No service URLs found in deployment output"
		log.Printf(result.Message)
		return result, fmt.Errorf(result.Message)
	}

	result.TotalServices = len(urls)
	for _, url := range urls {
		log.Printf(" * Testing service URL %v", url)
		code, err := testURL(context.Background(), log, url) // Still do a URL test if the test context is cancelledt
		if err == nil {
			result.OnlineServices++
			if code == 200 {
				result.HealthyServices++
			} else {
				result.Message = fmt.Sprintf("HTTP code: %v", code)
			}
		} else {
			result.Message = err.Error()
		}
		log.Printf(" * Test service URL result: %v -> %v, ERR: %v", url, code, err)
	}

	result.ServiceOnline = result.TotalServices > 0 && result.OnlineServices == result.TotalServices
	result.ServiceHealthy = result.TotalServices > 0 && result.HealthyServices == result.TotalServices

	if result.DeploySucceeded && result.ServiceOnline && result.ServiceHealthy && result.Message == "" {
		result.Message = "Success"
	}

	return result, nil
}

func testURL(ctx context.Context, logger logger.Logger, url string) (int, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return 0, err
	}

	var code int
	for tries := 0; tries < 5; tries++ {
		var content string
		code, content, err = doRequest(req)
		logger.Printf("   - Attempt %d: GET %s -> %d, ERR: %v, CONTENT:'%v'", tries, url, code, content, err)
		if err == nil && code == 200 {
			break
		}
		// 1, 2, 4, 8, 16 seconds
		delay := time.Second << tries
		pkg.SleepWithContext(ctx, delay)
	}
	return code, err
}

func doRequest(req *http.Request) (int, string, error) {
	client := &http.Client{
		Timeout: 10 * time.Second,
	}
	resp, err := client.Do(req)
	if err != nil {
		return 0, "", fmt.Errorf("HTTP GET failed: %w", err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return resp.StatusCode, string(body), fmt.Errorf("Failed to read the response body: %w\n", err)
	}
	return resp.StatusCode, string(body), nil
}

func (d *CliDeployer) SetConfigs(ctx context.Context, stdout, stderr io.Writer, log logger.Logger) error {
	for _, key := range d.Configs {
		value, ok := os.LookupEnv("TEST_" + key)
		if !ok {
			return fmt.Errorf("config %v not found in environment", key)
		}
		log.Printf("Creating config %v", key)
		if _, err := d.RunCommand(ctx, func(cmd *exec.Cmd) {
			cmd.Stdout = io.MultiWriter(&d.Stdout, stdout)
			cmd.Stderr = io.MultiWriter(&d.Stderr, stderr)
			cmd.Stdin = strings.NewReader(value)
		}, "defang", "config", "create", key); err != nil {
			return fmt.Errorf("failed to create config %v: %w", key, err)
		}
	}
	return nil
}

func (d *CliDeployer) Cleanup(ctx context.Context) error {
	var errs []error
	if d.HasDeployed {
		if _, err := d.RunCommand(ctx, nil, "defang", "compose", "down", "-f", d.ComposeFilePath); err != nil {
			errs = append(errs, fmt.Errorf("failed to run compose down: %w", err))
		}
	}

	if len(d.Configs) > 0 {
		for _, key := range d.Configs {
			if _, err := d.RunCommand(ctx, nil, "defang", "config", "delete", key); err != nil {
				errs = append(errs, fmt.Errorf("failed to delete config %v: %w", key, err))
			}
		}
	}

	if err := os.RemoveAll(d.StateDir); err != nil {
		errs = append(errs, fmt.Errorf("failed to remove state dir %v: %w", d.StateDir, err))
	}

	d.Stdout.Reset()
	d.Stderr.Reset()

	return errors.Join(errs...)
}

func (d *CliDeployer) RunCommand(ctx context.Context, opt func(*exec.Cmd), command string, args ...string) (*exec.Cmd, error) {
	cmd := exec.CommandContext(ctx, command, args...)
	cmd.Env = d.EnvVars
	if d.WorkDir != "" {
		cmd.Dir = d.WorkDir
	}
	// TODO: Capture output for later analysis
	cmd.Stdout = &d.Stdout
	cmd.Stderr = &d.Stderr

	if opt != nil {
		opt(cmd)
	}

	if err := cmd.Run(); err != nil {
		return cmd, fmt.Errorf("failed to run `%v %v`: %w", command, strings.Join(args, " "), err)
	}
	return cmd, nil
}
