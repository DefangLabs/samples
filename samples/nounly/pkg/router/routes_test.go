package router

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func echo(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("X-Method", r.Method)
	w.Header().Set("X-RequestURI", r.RequestURI)
	for i, f := range GetFields(r) {
		w.Header().Set(fmt.Sprintf("X-Field%d", i), f)
	}
	io.Copy(w, r.Body)
}

func TestRoutes(t *testing.T) {
	r := Routes{
		NewRoute("GET", "/api/v1/urls", echo),
		NewRoute("POST", "/api/v1", echo),
		NewRoute("DELETE", "/api/v1/urls/(.+)", echo),
	}
	tests := []struct {
		method string
		path   string
		code   int
		body   string
		fields []string
	}{
		{"GET", "/api/v1/urls", http.StatusOK, "", nil},
		{"HEAD", "/api/v1/urls", http.StatusOK, "", nil},
		{"GET", "/api/v1/urls/", http.StatusNotFound, "404 page not found\n", nil},
		{"GET", "/api/v1", http.StatusMethodNotAllowed, "405 method not allowed\n", nil},
		{"POST", "/api/v1", http.StatusOK, "", nil},
		{"POST", "/api/v1", http.StatusOK, "with body", nil},
		{"DELETE", "/api/v1/urls/123", http.StatusOK, "", []string{"123"}},
	}
	for _, tt := range tests {
		req := httptest.NewRequest(tt.method, tt.path, strings.NewReader(tt.body))
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		res := w.Result()
		defer res.Body.Close()
		if res.StatusCode != tt.code {
			t.Errorf("%s %s: got %d, want %d", tt.method, tt.path, w.Code, tt.code)
		}
		if tt.code == 200 && res.Header.Get("X-Method") != tt.method {
			t.Errorf("%s %s: got %q, want %q", tt.method, tt.path, res.Header.Get("X-Method"), tt.method)
		}
		if tt.code == 200 && res.Header.Get("X-RequestURI") != tt.path {
			t.Errorf("%s %s: got %q, want %q", tt.method, tt.path, res.Header.Get("X-RequestURI"), tt.path)
		}
		for i, f := range tt.fields {
			if res.Header.Get(fmt.Sprintf("X-Field%d", i)) != f {
				t.Errorf("%s %s: got %q, want %q", tt.method, tt.path, res.Header.Get(fmt.Sprintf("X-Field%d", i)), f)
			}
		}
		body, _ := io.ReadAll(res.Body)
		if string(body) != tt.body {
			t.Errorf("%s %s: got %q, want %q", tt.method, tt.path, body, tt.body)
		}
	}
}
