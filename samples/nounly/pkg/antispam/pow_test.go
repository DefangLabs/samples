package antispam

import "testing"

func TestCheckProofOfWork(t *testing.T) {
	const difficultyBits = 13
	if !CheckProofOfWork([]byte(`{"url":"https://tools.td.com/mortgage-affordability-calculator/","etag":"7c988e63c2ac05e611d3b8b5e67158b8","nonce":105,"date":"2020-08-26T13:59:28.853Z"}`), difficultyBits) {
		t.Errorf("Expected proof-of-work to pass, got false")
	}
	if !CheckProofOfWork([]byte(`{"url":"google.com","etag":"7c988e63c2ac05e611d3b8b5e67158b8","nonce":23859,"date":"2023-01-13T17:51:09.583Z"}`), difficultyBits) {
		t.Errorf("Expected proof-of-work to pass, got false")
	}
	if CheckProofOfWork([]byte(`blah`), difficultyBits) {
		t.Errorf("Expected proof-of-work to fail, got true")
	}
}
