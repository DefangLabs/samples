package nounly

import "testing"

func TestGetIncrementallyLongCodes(t *testing.T) {
	noun := GetIncrementallyLongCodes("http://google.com/aardvark-zoo-animal?code=title", func(string) bool { return true })
	if noun != "aardvark" {
		t.Errorf("Expected aardvark, got %q", noun)
	}
}
