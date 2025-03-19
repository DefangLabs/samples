package api

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"
)

// TODO: store these in a key-value store (redis)
var sharedSecrets = map[string][]byte{}

func init() {
	if val := os.Getenv("SHARED_SECRETS"); val != "" {
		if err := json.Unmarshal([]byte(val), &sharedSecrets); err != nil {
			panic(err)
		}
	}
}

func checkAuth(r *http.Request) bool {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return false
	}

	token, ok := strings.CutPrefix(authHeader, "SharedKey ")
	if !ok {
		return false
	}

	parts := strings.SplitN(token, ":", 2)
	sharedSecret := sharedSecrets[parts[0]]
	if len(parts) != 2 || sharedSecret == nil {
		return false
	}

	date := r.Header.Get("x-date")
	if date == "" {
		date = r.Header.Get("Date")
	}
	if !VerifyDate(date, time.Now()) {
		return false
	}

	if sign(sharedSecret, r.Method, date, r.RequestURI) != parts[1] {
		return false
	}

	// TODO: set CORS headers to allow authorized access from anywhere
	return true
}

func signRaw(secret, fields []byte) string {
	hmac := hmac.New(sha256.New, secret)
	return base64.StdEncoding.EncodeToString(hmac.Sum(fields))
}

func sign(secret []byte, fields ...string) string {
	return signRaw(secret, []byte(strings.Join(fields, "\n")))
}
