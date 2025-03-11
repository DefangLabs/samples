package nounly

import (
	"regexp"
	"testing"
)

func TestNouns(t *testing.T) {
	onlyLower := regexp.MustCompile(`^[a-z -]{2,}$`) // FIXME: remove spaces and dashes
	for _, noun := range nouns {
		if !onlyLower.MatchString(noun) {
			t.Errorf("Noun %q contains non-lowercase characters", noun)
		}
	}
}
