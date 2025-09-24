package antispam

import (
	"net"
	"testing"
)

func TestQueryDomainBlockList(t *testing.T) {
	tests := []struct {
		name       string
		hostname   string
		dblserver  string
		wantResult net.IP
	}{
		{
			name:       "example.com is not in the blocklist",
			hostname:   "example.com",
			dblserver:  "dbl.spamhaus.org",
			wantResult: nil,
		},
		{
			name:       "test is in the blocklist",
			hostname:   "test",
			dblserver:  "dbl.spamhaus.org",
			wantResult: []byte{127, 0, 1, 2},
		},
		{
			name:       "dbltest.com is in the blocklist",
			hostname:   "dbltest.com",
			dblserver:  "dbl.spamhaus.org",
			wantResult: []byte{127, 0, 1, 2},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotResult := queryDomainBlockList(tt.hostname, tt.dblserver)
			if !gotResult.Equal(tt.wantResult) {
				t.Errorf("queryDomainBlockList() = %v, want %v", gotResult, tt.wantResult)
			}
		})
	}
}

func TestQuerySpamBlockListByIP(t *testing.T) {
	tests := []struct {
		name       string
		ip         net.IP
		sblserver  string
		accessKey  string
		wantResult net.IP
	}{
		{
			name:       "8.8.4.4 is in the blocklist",
			ip:         []byte{8, 8, 4, 4},
			sblserver:  "sbl.spamhaus.org",
			accessKey:  "",
			wantResult: nil,
		},
		{
			name:       "8.8.4.4 is not in the blocklist with invalid access key",
			ip:         []byte{8, 8, 4, 4},
			sblserver:  "sbl.spamhaus.org",
			accessKey:  "invalid",
			wantResult: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotResult := querySpamBlockList(tt.ip, tt.sblserver, tt.accessKey)
			if !gotResult.Equal(tt.wantResult) {
				t.Errorf("querySpamBlockList() = %v, want %v", gotResult, tt.wantResult)
			}
		})
	}
}

func TestTryGetHostAddress(t *testing.T) {
	tests := []struct {
		name       string
		hostOrIP   string
		wantResult net.IP
		mask       net.IPMask
	}{
		{
			name:       "8.8.8.8 is a valid IP address",
			hostOrIP:   "8.8.8.8",
			wantResult: []byte{8, 8, 8, 8},
			mask:       []byte{255, 255, 255, 255},
		},
		{
			name:       "one.one.one.one is a valid hostname",
			hostOrIP:   "one.one.one.one",
			wantResult: []byte{1, 0, 0, 1},
			mask:       []byte{255, 254, 254, 255},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotResult := tryGetHostAddress(tt.hostOrIP)
			if !gotResult.Mask(tt.mask).Equal(tt.wantResult) {
				t.Errorf("tryGetHostAddress() = %v, want %v", gotResult, tt.wantResult)
			}
		})
	}
}

func TestIsSpamIp(t *testing.T) {
	tests := []struct {
		name       string
		ip         net.IP
		wantResult bool
	}{
		{
			name:       "nil IP is not a spammer",
			ip:         nil,
			wantResult: false,
		},
		{
			name:       "127.0.0.1 is a spammer",
			ip:         []byte{127, 0, 0, 1},
			wantResult: true,
		},
		{
			name:       "8.8.4.4 is not a spammer",
			ip:         []byte{8, 8, 4, 4},
			wantResult: false,
		},
		{
			name:       "127.0.0.12 is a spammer",
			ip:         []byte{127, 0, 0, 12},
			wantResult: true,
		},
		{
			name:       "127.0.0.255 is not a spammer",
			ip:         []byte{127, 0, 0, 255},
			wantResult: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if gotResult := isSpamIP(tt.ip); gotResult != tt.wantResult {
				t.Errorf("isSpamIP() = %v, want %v", gotResult, tt.wantResult)
			}
		})
	}
}

func Test_tryGetHostAddress(t *testing.T) {
	if !tryGetHostAddress("8.8.8.8").Equal([]byte{8, 8, 8, 8}) {
		t.Error("Expected 8.8.8.8")
	}
	if tryGetHostAddress("one.one.one.one")[0] != 1 {
		t.Error("Expected 1.x.x.1")
	}
}
