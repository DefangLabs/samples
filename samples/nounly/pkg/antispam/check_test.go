package antispam

import "testing"

func TestCheckSpamBlockList(t *testing.T) {
	tests := []struct {
		name       string
		hostOrIP   string
		sblserver  string
		accessKey  string
		wantResult bool
	}{
		{
			name:       "google.com is not in the blocklist",
			hostOrIP:   "google.com",
			sblserver:  "sbl.spamhaus.org",
			accessKey:  "",
			wantResult: false,
		},
		{
			name:       "8.8.4.4 is not in the blocklist",
			hostOrIP:   "8.8.4.4",
			sblserver:  "sbl.spamhaus.org",
			accessKey:  "",
			wantResult: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotResult := CheckSpamBlockList(tt.hostOrIP, tt.sblserver, tt.accessKey)
			if gotResult != tt.wantResult {
				t.Errorf("CheckSpamBlockList() = %v, want %v", gotResult, tt.wantResult)
			}
		})
	}
}
