package test

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"regexp"
	"text/tabwriter"
	"time"

	"defang.io/tools/testing/detector"
	"defang.io/tools/testing/logger"
)

var Debug = true

// Declare a TestInfo structure with name and folder path
type TestInfo struct {
	Name   string
	Folder string

	Envs []string

	Logger logger.Logger
	Stdout io.WriteCloser
	Stderr io.WriteCloser
}

// Define a struct to hold each item's processing results
type ItemResult struct {
	Name            string
	DeploySucceeded bool
	ServiceOnline   bool
	ServiceHealthy  bool
	Message         string

	TotalServices   int
	OnlineServices  int
	HealthyServices int

	Duration time.Duration
}

func log(v ...interface{}) {
	if Debug {
		fmt.Println(v...)
	}
}

func logf(format string, v ...interface{}) {
	if Debug {
		fmt.Printf(format, v...)
	}
}

func Run(ctx context.Context, test TestInfo) (*ItemResult, error) {
	log("Running test", test.Name, "from folder", test.Folder)

	cmdCtx, cancelCmd := context.WithCancel(ctx)
	defer cancelCmd()
	// Invoke the 'defang' CLI tool and capture its output + return code
	cmd := exec.CommandContext(cmdCtx, "defang", "compose", "up", "--verbose")

	// Specify the folder to run the command in
	cmd.Dir = test.Folder

	// Specify environment variables
	cmd.Env = test.Envs //, "AWS_PROFILE=defang-playground")

	// Create a buffer to capture combined stdout and stderr
	var outputBuf bytes.Buffer

	// Create a string detector to capture 'failed to wait for service status' message to stop the command
	detector := &detector.StringDetector{
		Target:   "! failed to wait for service status:",
		Callback: cancelCmd,
	}

	// Set both stdout and stderr to the same io.MultiWriter
	cmd.Stdout = io.MultiWriter(os.Stdout, &outputBuf, detector)
	cmd.Stderr = io.MultiWriter(os.Stdout, &outputBuf, detector) // cmd.Stdout // Redirect stderr to the same writer as stdout

	// Run the command
	err := cmd.Run()
	if err != nil {
		if _, ok := err.(*exec.Error); ok {
			return nil, fmt.Errorf("Error: Executable not found!")
		}
		logf("Error running command: %v\n", err)
	}

	exitCode := cmd.ProcessState.ExitCode()

	// Convert the buffer's content to a string
	outputStr := outputBuf.String()

	// declare variable for url
	var url string

	// Regular expression to capture an "https://" URL that follows "DEPLOYMENT_COMPLETED"
	re := regexp.MustCompile(`DEPLOYMENT_COMPLETED\s*((?:https?://)?[^\s]+)`)

	// Find the first match in the output string
	match := re.FindStringSubmatch(outputStr)

	// Check if a match was found and has the expected subgroup
	if match != nil && len(match) > 1 {
		url = match[1]
	} else {
		url = ""
	}

	// Print the combined output
	logf("\nCombined output:\n%s\n", outputStr)

	// Print the return code
	logf("Command finished with return code: %d\n", exitCode)

	// Print the URL
	logf("URL: %s\n", url)

	// Create a file to log output
	const outDir = "./out"
	if err := os.MkdirAll(outDir, os.ModePerm); err != nil {
		return nil, fmt.Errorf("Error creating output directory: %w\n", err)
	}
	logFile, err := os.CreateTemp(outDir, test.Name+".*.log")
	if err != nil {
		return nil, fmt.Errorf("Error creating log file: %w\n", err)
	}
	defer logFile.Close()

	// Write the output and return code to the log file
	logFile.WriteString(outputStr)
	logFile.WriteString(fmt.Sprintf("Command finished with return code: %d\n", exitCode))
	logFile.WriteString(fmt.Sprintf("URL: %s\n", url))

	// Call the chatGPT function
	//processWithGPT(outputStr)

	itemResult := ItemResult{
		Name:            test.Name,
		DeploySucceeded: exitCode == 0,
		ServiceOnline:   false,
		ServiceHealthy:  false,
	}

	if exitCode != 0 {
		itemResult.Message = fmt.Sprintf("Return code: %d", exitCode)
		return &itemResult, nil
	}

	if url == "" {
		log("No URL found, skipping service validation")
		itemResult.Message = "Could not find service URL"
		return &itemResult, nil
	}

	// Send a GET request to the URL
	client := &http.Client{
		Timeout: 10 * time.Second, // Set timeout to 10 seconds
	}

	// Send a GET request using the custom client
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		logf("Failed to create request: %v\n", err)
		itemResult.Message = "Failed to create request object"
		return &itemResult, nil
	}

	for tries := 0; tries < 5; tries++ {
		resp, err := client.Do(req)
		if resp != nil {
			defer resp.Body.Close()
		}
		if err == nil {
			itemResult.ServiceOnline = true

			if resp.StatusCode == 200 {
				itemResult.ServiceHealthy = true

				// Print the response body to log
				body, err := io.ReadAll(resp.Body)
				if err != nil {
					logFile.WriteString(fmt.Sprintf("Failed to read the response body: %v\n", err))
					itemResult.Message = "Failed to read the response body"
				}
				logFile.WriteString(fmt.Sprintf("Response Body:\n%s\n", body))
			} else {
				itemResult.Message = fmt.Sprintf("HTTP code: %d", resp.StatusCode)
			}

			// Print the status code to log
			logFile.WriteString(fmt.Sprintf("HTTP status code: %d\n", resp.StatusCode))
			break
		} else {
			itemResult.Message = fmt.Sprintf("HTTP GET failed: %v", err)
		}
		// 1, 2, 4, 8, 16 seconds
		delay := time.Second << tries
		SleepWithContext(ctx, delay)
	}

	return &itemResult, nil
}

func PrintResultsTable(results []*ItemResult) {
	writer := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', tabwriter.AlignRight)
	fmt.Fprintln(writer, "Name\tDeploy Succeeded\tService Online\tService Healthy\tMessage\t")

	for _, result := range results {
		fmt.Fprintf(writer, "%s\t%v\t%v\t%v\t%s\t\n",
			result.Name,
			result.DeploySucceeded,
			result.ServiceOnline,
			result.ServiceHealthy,
			result.Message, // Print the custom message for each item
		)
	}

	writer.Flush() // Make sure to flush to output the table
}

func SleepWithContext(ctx context.Context, d time.Duration) error {
	timer := time.NewTimer(d)
	defer timer.Stop()
	select {
	case <-timer.C:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}
