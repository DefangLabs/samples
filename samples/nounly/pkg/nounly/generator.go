package nounly

import (
	"hash/adler32"
	"math/bits"
	"net/url"
	"regexp"
	"strings"
)

const separator = " "

var wordRegex = regexp.MustCompile(`\w+`)
var known = parse(nouns)

// type Set map[string]bool
type CallbackFunc func(string) bool

func parse(nouns []string) map[string]bool {
	known := make(map[string]bool, len(nouns))
	for _, noun := range nouns {
		known[noun] = true
	}
	return known
}

func GetIncrementallyLongCodes(uriString string, callback CallbackFunc) string {
	hash := adler32.Checksum([]byte(uriString))

	parsedURL, err := url.Parse(uriString)
	if err == nil {
		uriString = parsedURL.RequestURI()
	}

	// Find known nouns from the URL
	for _, match := range wordRegex.FindAllString(uriString, -1) {
		noun := strings.ToLower(match)
		if exists := known[noun]; exists && callback(noun) {
			return noun
		}
	}

	// Backwards compatibility
	i := hash % uint32(len(nouns))
	noun := nouns[i>>1]
	if callback(noun) {
		return noun
	}

	// New: start with 1 word and use more bits from the hash
	for t := 22; t >= 0; t -= 2 {
		noun = getCodes(hash >> t)
		if callback(noun) {
			return noun
		}
	}

	// Keep going, rotating left
	for t := 1; t < 32; t += 2 {
		noun = getCodes(bits.RotateLeft32(hash, t))
		if callback(noun) {
			return noun
		}
	}

	return ""
}

func getCode(i uint32) string {
	return nouns[i%uint32(len(nouns))]
}

func getCodes(i uint32) string {
	s := getCode(i)
	for {
		i /= uint32(len(nouns))
		if i == 0 {
			break
		}
		s += separator + getCode(i)
	}
	return s
}
