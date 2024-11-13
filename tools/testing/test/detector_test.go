package test

import "testing"

func TestStringDetector(t *testing.T) {
	found := false
	detector := &StringDetector{
		Target:   "some long string",
		Callback: func() { found = true },
	}

	foundData := []string{
		"prefix ", "and some new line\n",
		"then some prefix ", " and the first half some lo", "ng string and the second half\n",
		"and some suffix",
	}
	for _, data := range foundData {
		detector.Write([]byte(data))
	}
	if !found {
		t.Error("expected callback to be called")
	}

	found = false
	notFoundData := []string{
		"prefix ", "and some new line\n",
		"then some prefix ", " and the first half some lo\n",
		"ng string and the second half\n",
		"and some suffix",
	}
	for _, data := range notFoundData {
		detector.Write([]byte(data))
	}
	if found {
		t.Error("expected callback not to be called")
	}
}
