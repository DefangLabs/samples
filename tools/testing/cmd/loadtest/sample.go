package main

import (
	"context"
	"log"
	"os"
	"regexp"
)

type Sample struct {
	LocalPath string
}

func FindSamples(ctx context.Context, namePatterns, excludePatterns []string) ([]string, error) {
	nameRegexps := make([]*regexp.Regexp, len(namePatterns))
	for i, namePattern := range namePatterns {
		rgx, err := regexp.Compile(namePattern)
		if err != nil {
			return nil, err
		}
		nameRegexps[i] = rgx
	}

	excludeRegexps := make([]*regexp.Regexp, len(excludePatterns))
	for i, excludePattern := range excludePatterns {
		rgx, err := regexp.Compile(excludePattern)
		if err != nil {
			return nil, err
		}
		excludeRegexps[i] = rgx
	}

	sampleNames, err := listSamples()
	if err != nil {
		return nil, err
	}

	var matchedCount, excludedCount int
	var found []string
	for _, sampleName := range sampleNames {
		matched := false
		for _, rgx := range nameRegexps {
			if rgx.MatchString(sampleName) {
				matched = true
				break
			}
		}
		if !matched {
			continue
		}
		matchedCount++

		for _, rgx := range excludeRegexps {
			if rgx.MatchString(sampleName) {
				matched = false
				break
			}
		}
		if matched {
			found = append(found, sampleName)
		} else {
			excludedCount++
		}
	}
	log.Printf("Found %d samples from a total of %d; %d matched, %d excluded", len(found), len(sampleNames), matchedCount, excludedCount)
	return found, nil
}

func listSamples() ([]string, error) {
	dirents, err := os.ReadDir("./samples")
	if err != nil {
		return nil, err
	}

	var directories []string
	for _, dirent := range dirents {
		if dirent.IsDir() {
			directories = append(directories, dirent.Name())
		}
	}

	return directories, nil
}
