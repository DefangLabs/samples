package deployer

import (
	"slices"
	"testing"
)

func Test_findUrlsInOutput(t *testing.T) {
	tests := []struct {
		name string
		out  string
		want []string
	}{
		{
			name: "single url",
			out:  "some log\nDEPLOYMENT_COMPLETED\thttps://my-service.defang.io\nmore log",
			want: []string{"https://my-service.defang.io"},
		},
		{
			name: "multiple urls",
			out:  "log\nDEPLOYMENT_COMPLETED\thttps://service1.defang.io\nlog\nDEPLOYMENT_COMPLETED\thttps://service2.defang.io\nend",
			want: []string{"https://service1.defang.io", "https://service2.defang.io"},
		},
		{
			name: "no urls",
			out:  "just some logs without urls",
			want: nil,
		},
		{
			name: "internal url ignored",
			out:  "log\nDEPLOYMENT_COMPLETED\tservice.internal:8080\nend",
			want: nil,
		},
		{
			name: "url without scheme",
			out:  "log\nDEPLOYMENT_COMPLETED\tmy-service.defang.io\nend",
			want: nil,
		},
		{
			name: "some other string",
			out:  "log\nDEPLOYMENT_COMPLETED\tjust-a-string\nend",
			want: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := findUrlsInOutput(tt.out); !slices.Equal(got, tt.want) {
				t.Errorf("findUrlsInOutput() = %v, want %v", got, tt.want)
			}
		})
	}
}
