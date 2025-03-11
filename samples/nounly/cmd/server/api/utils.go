package api

import (
	"net"
	"net/http"
	"strings"
	"time"
)

const clockSkew = 5 * time.Minute

func GetClientIP(req *http.Request) string {
	// get the client IP from the proxy (if any); TODO: prevent spoofing
	xff := req.Header.Get("x-forwarded-for")
	if xff != "" {
		comma := strings.Index(xff, ",")
		if comma == -1 {
			return canonicalIP(xff)
		}
		return canonicalIP(xff[:comma])
	}
	return canonicalIP(strings.SplitN(req.RemoteAddr, ":", 2)[0])
}

func canonicalIP(ip string) string {
	return net.ParseIP(ip).String()
}

func VerifyDate(dateHeader string, now time.Time) bool {
	date, err := time.Parse(time.RFC3339, dateHeader)
	if err != nil {
		return false
	}
	diff := now.Sub(date)
	return diff > -clockSkew && diff < clockSkew
}
