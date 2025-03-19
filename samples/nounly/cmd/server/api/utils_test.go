package api

import (
	"testing"
	"time"
)

func TestCanonicalIP(t *testing.T) {
	tests := []struct {
		ip   string
		want string
	}{
		{"::ffff:83.90.47.30", "83.90.47.30"},
		{"83.90.47.30", "83.90.47.30"},
		{"fe80::676d:489:1f16:2c1", "fe80::676d:489:1f16:2c1"},
	}
	for _, tt := range tests {
		t.Run(tt.ip, func(t *testing.T) {
			if got := canonicalIP(tt.ip); got != tt.want {
				t.Errorf("canonicalIP() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestVerifyDate(t *testing.T) {
	now := time.Date(2023, 1, 13, 17, 51, 0, 0, time.UTC)
	tests := []struct {
		date string
		now  time.Time
		want bool
	}{
		{
			date: "2023-01-13T17:51:09.583Z",
			want: true,
		},
		{
			date: "2023-01-13T17:59:09.583Z",
			want: false,
		},
		{
			date: "2020-01-01T17:59:09.583Z",
			want: false,
		},
		{
			date: "invalid date",
			want: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.date, func(t *testing.T) {
			if got := VerifyDate(tt.date, now); got != tt.want {
				t.Errorf("verifyDate() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestSign(t *testing.T) {
	secret := []byte("secret")
	fields := []string{"GET", "2023-01-13T17:51:09.583Z", "/api/v1/urls"}
	want := "R0VUCjIwMjMtMDEtMTNUMTc6NTE6MDkuNTgzWgovYXBpL3YxL3VybHP55m4Xm2dHrlQQj4L4reizwl12/TCv3mw5WCLFMBlhaQ=="
	if got := sign(secret, fields...); got != want {
		t.Errorf("sign() = %v, want %v", got, want)
	}
}
