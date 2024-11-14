package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"math"
	"os"
	"os/signal"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"text/tabwriter"
	"time"

	"github.com/DefangLabs/defang/src/pkg/types"
	"github.com/spf13/pflag"

	"defang.io/tools/testing/cleanup"
	"defang.io/tools/testing/deployer"
	"defang.io/tools/testing/login"
	"defang.io/tools/testing/test"
	"github.com/compose-spec/compose-go/v2/cli"
)

var (
	cluster         = pflag.StringP("cluster", "c", "fabric-dev.gnafed.click:443", "The cluster to run test on")
	composeFilePath = pflag.StringP("compose-file", "f", "", "The path to the docker-compose file") // TODO: Allow pulling random example compose files
	concurrency     = pflag.IntP("concurrency", "n", 1, "The number of tests could be run concurrently, set to 0 to run all tests concurrently")
	total           = pflag.IntP("total", "t", 0, "The total number of tests to be run")
	rampupGap       = pflag.DurationP("rampup-gap", "r", 0, "The gap between each test in the rampup")
	samples         = pflag.StringSliceP("samples", "s", nil, "The list of regular expressions matches the sample name to be used for the load test")
	exclude         = pflag.StringSliceP("exclude", "x", nil, "The list of regular expressions matches the sample name to be excluded from the load test")
	list            = pflag.StringSliceP("list", "l", nil, "List available samples")
	output          = pflag.StringP("output", "o", "", "The output folder to write the results to, will be created if not exists, no results will be written if not provided")
	markdown        = pflag.BoolP("markdown", "m", false, "Output the results in markdown format")
	dryrun          = pflag.BoolP("dry-run", "d", false, "Dry run the tests without actually deploying anything")
	timeout         = pflag.DurationP("timeout", "T", 15*time.Minute, "The timeout for each deploy, set to 0 to disable")
)

func init() {
	pflag.Usage = func() {
		fmt.Fprintf(os.Stderr, "Usage of %s:\n\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "  AWS_PROFILE=defang-staging AWS_REGION=us-west-2 %s -c fabric-staging.defang.dev:443 -n 3 -f somecomposefile.yaml --rampup-gap=1m\n\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "or\n\n")
		fmt.Fprintf(os.Stderr, "  AWS_PROFILE=defang-staging AWS_REGION=us-west-2 %s -c fabric-staging.defang.dev:443 --concurrency=3 --total=10 -s SAMPLE_KEYWORD_REGEX\n\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "AWS credentials and region for the matching account to the cluster is needed to access fixed verifier private key\n\n")
		fmt.Fprintf(os.Stderr, "To list available samples use:\n\n")
		fmt.Fprintf(os.Stderr, "  %s -l SAMPLE_KEYWORD_REGEX\n\n", os.Args[0])
		pflag.PrintDefaults()
	}
	pflag.Parse()
}

func main() {
	if len(*list) > 0 {
		PrintSamples(*list, *exclude)
		return
	}

	if *composeFilePath == "" && len(*samples) == 0 {
		log.Printf("--compose-file or --samples is required")
		pflag.Usage()
		os.Exit(1)
	}

	if *composeFilePath != "" && len(*samples) > 0 {
		log.Printf("only one of --compose-file or --samples is allowed")
		pflag.Usage()
		os.Exit(1)
	}

	// Handle Ctrl+C so we can exit gracefully
	ctx, cancel := context.WithCancel(context.Background())
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, os.Interrupt)

	go func() {
		<-sigs
		log.Printf("Received interrupt signal; stopping the test...")
		cancel()
	}()

	var runErr error
	if len(*samples) > 0 {
		runErr = RunSamples(ctx, *samples, *exclude, *concurrency, *total)
	} else {
		runErr = RunComposeFile(ctx, *composeFilePath, *concurrency, *total, *rampupGap)
	}
	if runErr != nil {
		log.Printf("failed to run tests : %v", runErr)
	}

	cleanUpErr := cleanup.Run()
	if cleanUpErr != nil {
		log.Printf("failed to cleanup: %v", cleanUpErr)
	}

	if runErr != nil || cleanUpErr != nil {
		os.Exit(1)
	}
}

func RunSamples(ctx context.Context, samplePatterns, excludePatters []string, concurrency, total int) error {
	tokenIssuer, err := login.NewTokenIssuer(ctx, *cluster)
	if err != nil {
		return fmt.Errorf("failed to create token issuer, %w", err)
	}

	samples, err := FindSamples(ctx, samplePatterns, excludePatters)
	if err != nil {
		return fmt.Errorf("failed to load samples: %w", err)
	}

	if concurrency < 1 {
		concurrency = len(samples)
	}

	samplesChannel := make(chan string)
	resultsChannel := make(chan *test.ItemResult)

	go func() {
		if total < 1 {
			total = len(samples)
		}
		for i := 0; i < total; i++ {
			s := samples[i%len(samples)]
			samplesChannel <- s
		}
		close(samplesChannel)
	}()

	workers := int(math.Min(float64(concurrency), float64(len(samples))))

	var wg sync.WaitGroup
	log.Printf("Starting %v concurrent tests...", workers)
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			log.Printf("Starting deployer %v...", id)
			defer log.Printf("Deployer %v done", id)

			tenantId := types.TenantID(fmt.Sprintf("defangSampleTestFakeTenant%v", id))
			deployer, err := deployer.New(ctx, id, tokenIssuer, *cluster, tenantId)
			if err != nil {
				log.Printf("failed to create deployer %v: %v", id, err)
				return
			}

			if err := deployer.Setup(ctx); err != nil {
				log.Printf("failed to setup deployer %v: %v", id, err)
				log.Printf("STDOUT:\n%v\n", deployer.Stdout.String())
				log.Printf("STDERR:\n%v\n", deployer.Stderr.String())
				log.Printf("LOGS:\n%v\n", deployer.Logs.String())
				return
			}

			for s := range samplesChannel {
				log.Printf("Deployer %v: running test %v...", id, s)
				select {
				case <-ctx.Done():
					log.Printf("Deployer %v: context cancelled, cancel test %v", id, s)
					return
				default:
					if *dryrun {
						log.Printf("Deployer %v: skipped deployment of sample %q - dry run", id, s)
						resultsChannel <- &test.ItemResult{Name: s, Message: "dry run"}
						continue
					}
					result, err := deploySample(ctx, id, deployer, s, *output)
					if err != nil {
						log.Printf("Deployer %v: failed to run test %v: %v", id, s, err)
						continue
					}
					resultsChannel <- result
				}
			}
		}(i)
	}

	go func() {
		wg.Wait()
		close(resultsChannel)
	}()

	var results []*test.ItemResult
	for r := range resultsChannel {
		results = append(results, r)
	}

	if len(results) == 0 {
		return errors.New("no results found")
	} else {
		PrintResultsTable(results)
	}

	for _, r := range results {
		if !r.DeploySucceeded || !r.ServiceOnline || !r.ServiceHealthy {
			return errors.New("one or more tests failed")
		}
	}
	return nil
}

func deploySample(ctx context.Context, id int, deployer *deployer.CliDeployer, sampleName string, output string) (*test.ItemResult, error) {
	var deployCtx context.Context
	var cancel context.CancelFunc
	if *timeout > 0 {
		deployCtx, cancel = context.WithTimeout(ctx, *timeout)
	} else {
		deployCtx, cancel = context.WithCancel(ctx)
	}

	// file join
	samplePath := filepath.Join("samples", sampleName)

	t := test.TestInfo{Name: sampleName, Folder: samplePath}
	var resultDir string
	if output != "" {
		d, l, o, e, err := createOutputFiles(output, sampleName)
		if err != nil {
			log.Printf("failed to create output files for test %v: %v, no logs will be written for the test", sampleName, err)
			t.Logger = log.New(os.Stderr, fmt.Sprintf("Deployer %v: ", id), log.LstdFlags)
		} else {
			t.Logger = log.New(l, "", log.LstdFlags)
			t.Stdout = o
			t.Stderr = e
		}
		resultDir = d

		defer func() {
			l.Close()
			o.Close()
			e.Close()
		}()
	}

	configs, err := loadConfigNames(ctx, samplePath)
	if err != nil {
		cancel()
		return nil, fmt.Errorf("failed to load configs for test %v: %w", sampleName, err)
	}

	deployer.Configs = configs

	result, err := deployer.RunDeployTest(deployCtx, t)
	cancel()
	if err != nil {
		t.Logger.Printf("deployer %v failed to run test %v at %v: %v", id, sampleName, samplePath, err)
	}

	if result != nil && resultDir != "" {
		WriteResults(result, resultDir)
	}

	// cleanup needs its own context since the main has been cancelled
	cleanUpCtx, cleanUpCancel := context.WithTimeout(context.Background(), 10*time.Minute)
	if err := deployer.Cleanup(cleanUpCtx); err != nil {
		t.Logger.Printf("failed to cleanup deployer %v for test %v at %v: %v", id, sampleName, samplePath, err)
	}
	cleanUpCancel()
	return result, nil
}

func createOutputFiles(output, name string) (dir string, logFile, outFile, errFile *os.File, err error) {
	if err := os.MkdirAll(filepath.Join(output), 0755); err != nil {
		return "", nil, nil, nil, fmt.Errorf("failed to create output folder %q: %w", output, err)
	}

	dir, err = os.MkdirTemp(output, fmt.Sprintf("%v-*", name))
	if err != nil {
		return "", nil, nil, nil, fmt.Errorf("failed to create output folder for sample %q: %w", name, err)
	}

	logFile, err = os.Create(filepath.Join(dir, "test.log"))
	if err != nil {
		return "", nil, nil, nil, fmt.Errorf("failed to create log file for sample %q: %w", name, err)
	}

	stdoutFile, err := os.Create(filepath.Join(dir, "stdout.log"))
	if err != nil {
		return "", nil, nil, nil, fmt.Errorf("failed to create stdout file for sample %q: %w", name, err)
	}

	stderrFile, err := os.Create(filepath.Join(dir, "stderr.log"))
	if err != nil {
		return "", nil, nil, nil, fmt.Errorf("failed to create stderr file for sample %q: %w", name, err)
	}

	return dir, logFile, stdoutFile, stderrFile, nil
}

type ResultByName []*test.ItemResult

func (a ResultByName) Len() int           { return len(a) }
func (a ResultByName) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a ResultByName) Less(i, j int) bool { return a[i].Name < a[j].Name }

func PrintResultsTable(results []*test.ItemResult) {
	sort.Sort(ResultByName(results))

	nameWidth := 0
	for _, r := range results {
		if len(r.Name) > nameWidth {
			nameWidth = len(r.Name)
		}
	}

	var buf strings.Builder
	flags := tabwriter.AlignRight
	if *markdown {
		flags |= tabwriter.Debug
	}
	writer := tabwriter.NewWriter(&buf, 0, 0, 2, ' ', flags)
	fmt.Fprintf(writer, "%v\tDeploy Succeeded\tService Online\tService Healthy\tDuration\tMessage\t\n", fmt.Sprintf("%-*v", nameWidth, "Name"))
	if *markdown {
		fmt.Fprintln(writer, "----\t----\t----\t----\t----\t----\t")
	}

	for _, result := range results {
		fmt.Fprintf(writer, "%s\t%v\t",
			fmt.Sprintf("%-*v", nameWidth, result.Name),
			result.DeploySucceeded,
		)
		if result.ServiceOnline {
			fmt.Fprintf(writer, "%v\t", result.ServiceOnline)
		} else {
			fmt.Fprintf(writer, "%v/%v\t", result.OnlineServices, result.TotalServices)
		}
		if result.ServiceHealthy {
			fmt.Fprintf(writer, "%v\t", result.ServiceHealthy)
		} else {
			fmt.Fprintf(writer, "%v/%v\t", result.HealthyServices, result.TotalServices)
		}
		fmt.Fprintf(writer, "%v\t", result.Duration)
		fmt.Fprintf(writer, "%s\t\n", result.Message) // Print the custom message for each item
	}
	writer.Flush() // Make sure to flush to output the table
	if *markdown {
		lines := strings.Split(buf.String(), "\n")
		for _, line := range lines {
			if line == "" {
				continue
			}
			fmt.Println("|" + line)
		}
	} else {
		fmt.Println(buf.String())
	}
}

func WriteResults(r *test.ItemResult, dir string) error {
	of, err := os.Create(filepath.Join(dir, "summary.log"))
	if err != nil {
		return fmt.Errorf("failed to create summary file for %q: %w", r.Name, err)
	}
	fmt.Fprintf(of, "# Test Summary for %v\n", r.Name)
	fmt.Fprintf(of, "Deploy Succeeded: %v\n", r.DeploySucceeded)
	fmt.Fprintf(of, "Service Online: %v (%v/%v)\n", r.ServiceOnline, r.OnlineServices, r.TotalServices)
	fmt.Fprintf(of, "Service Healthy: %v (%v/%v)\n", r.ServiceHealthy, r.HealthyServices, r.TotalServices)
	fmt.Fprintf(of, "Duration: %v\n", r.Duration)
	fmt.Fprintf(of, "Message: %v\n\n", r.Message)

	of.Close()
	return nil
}

func RunComposeFile(ctx context.Context, composeFilePath string, concurrency, total int, rampupGap time.Duration) error {
	if total > 0 {
		log.Printf("`total` is not supported and ignored when running a single compose file")
	}
	if concurrency < 1 {
		concurrency = 1
	}

	tokenIssuer, err := login.NewTokenIssuer(ctx, *cluster)
	if err != nil {
		return fmt.Errorf("failed to create token issuer, %w", err)
	}

	var wg sync.WaitGroup
	for i := 0; i < concurrency; i++ {
		tenantId := types.TenantID(fmt.Sprintf("defangLoadtestFakeTenant%d", i))
		wg.Add(1)
		go func(tenantId types.TenantID) {
			defer wg.Done()
			deployer, err := deployer.New(ctx, i, tokenIssuer, *cluster, tenantId)
			deployer.SetComposeFilePath(composeFilePath)
			if err != nil {
				log.Fatalf("failed to create deployer for tenant %v: %v", tenantId, err)
			}

			if err := deployer.Deploy(ctx); err != nil {
				log.Printf("failed to deploy for tenant %v: %v", tenantId, err)
			}

			<-ctx.Done() // Wait for the context to be cancelled

			log.Printf("Starting cleanning up for tenant %v...", tenantId)
			cleanupCtx, cancel := context.WithCancel(context.Background())
			defer cancel()
			if err := deployer.Cleanup(cleanupCtx); err != nil {
				log.Printf("failed to cleanup for tenant %v: %v", tenantId, err)
			}
		}(tenantId)
		if rampupGap > 0 {
			test.SleepWithContext(ctx, rampupGap)
		}
	}

	wg.Wait()
	return nil
}

func PrintSamples(patterns, exclude []string) {
	samples, err := FindSamples(context.Background(), patterns, exclude)
	if err != nil {
		log.Fatalf("failed to find samples: %v", err)
	}
	if len(samples) == 0 {
		log.Printf("no samples found")
		return
	}
	writer := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
	fmt.Fprintf(writer, "Name\n")
	for _, s := range samples {
		fmt.Fprintf(writer, "%v\n", s)
	}
	writer.Flush()
}

func loadConfigNames(ctx context.Context, samplePath string) ([]string, error) {
	var configNames []string

	projOpts, err := cli.NewProjectOptions([]string{filepath.Join(samplePath, "compose.yaml")})
	if err != nil {
		return nil, fmt.Errorf("failed to create project options: %w", err)
	}
	project, err := projOpts.LoadProject(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to load project: %w", err)
	}

	for _, service := range project.Services {
		for key, val := range service.Environment {
			// if the val is empty add the key to the list
			if val == nil {
				configNames = append(configNames, key)
			} else if *val == "" {
				configNames = append(configNames, key)
			}
		}
	}

	return configNames, nil
}
