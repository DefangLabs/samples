package main

import (
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/lionello/nounly-go/pkg/antispam"
	"github.com/lionello/nounly-go/pkg/nounly"
	"github.com/lionello/nounly-go/pkg/store"
)

func testHandlerFunc(method, target string, body io.Reader, handler http.HandlerFunc) *http.Response {
	req := httptest.NewRequest(method, target, body)
	w := httptest.NewRecorder()
	handler(w, req)
	return w.Result()
}

func TestHappyPath(t *testing.T) {
	rdb := miniredis.RunT(t)
	nounly.Table = store.NewRedisTable(rdb.Addr())

	t.Run("get non-existent", func(t *testing.T) {
		res := testHandlerFunc("GET", "/testasdf", nil, get)
		if res.StatusCode != 302 {
			t.Errorf("get() = %d, want %d", res.StatusCode, 302)
		}
		defer res.Body.Close()
		data, err := io.ReadAll(res.Body)
		if err != nil {
			t.Fatal(err)
		}
		if string(data) != "<a href=\"/?testasdf\">Found</a>.\n\n" {
			t.Errorf("get() = %q, want %q", data, "<a href=\"/?testasdf\">Found</a>.\n\n")
		}
	})

	uniqueUrl := fmt.Sprintf("https://example.com/?%d", time.Now().Unix())

	var etag string
	var code string
	t.Run("post", func(t *testing.T) {
		t.Setenv("DEFANG_FQDN", "example.com")

		now := time.Now().UTC().Format(time.RFC3339)
		payload := fmt.Sprintf(`{"url":%q,"date":%q}`, uniqueUrl, now)
		res := testHandlerFunc("POST", "/", strings.NewReader(payload), post)

		if res.StatusCode != 200 {
			t.Errorf("post() = %d, want %d", res.StatusCode, 200)
		}
		var response map[string]string
		if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
			t.Fatal(err)
		}
		etag = response["etag"]
		if etag == "" {
			t.Errorf("post() = %q, want non-empty etag", etag)
		}
		code = response["code"]
		if code == "" {
			t.Errorf("post() = %q, want non-empty code", code)
		}
		if response["url"] != ("http://example.com/")+code {
			t.Errorf("post() = %q, want %q", response["url"], ("http://example.com/")+code)
		}
	})

	t.Run("post spam w/o nonce", func(t *testing.T) {
		now := time.Now().UTC().Format(time.RFC3339)
		payload := fmt.Sprintf(`{"url":%q,"date":%q}`, uniqueUrl, now)
		res := testHandlerFunc("POST", "/", strings.NewReader(payload), post)
		if res.StatusCode != 429 {
			t.Errorf("post() = %d, want %d", res.StatusCode, 429)
		}
		var response map[string]string
		if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
			t.Fatal(err)
		}
		if response["error"] != "The server is busy" {
			t.Errorf("post() = %q, want %q", response["error"], "The server is busy")
		}
	})

	t.Run("post spam w/ nonce", func(t *testing.T) {
		var payload string
		for {
			now := time.Now().UTC().Format(time.RFC3339)
			payload = fmt.Sprintf(`{"url":%q,"date":%q,"nonce":%d}`, uniqueUrl, now, rand.Int())
			if antispam.CheckProofOfWork([]byte(payload), difficultyBits) {
				break
			}
		}
		res := testHandlerFunc("POST", "/", strings.NewReader(payload), post)
		if res.StatusCode != 200 {
			t.Errorf("post() = %d, want %d", res.StatusCode, 200)
		}
		var response map[string]string
		if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
			t.Fatal(err)
		}
		if response["etag"] != "" {
			t.Errorf("post() = %q, want empty etag", etag)
		}
		if response["code"] != code {
			t.Errorf("post() = %q, want non-empty code", code)
		}
		if response["url"] != "https://noun.ly/"+code {
			t.Errorf("post() = %q, want %q", response["url"], "https://noun.ly/"+code)
		}
	})

	t.Run("get existent", func(t *testing.T) {
		res := testHandlerFunc("GET", "/"+code, nil, get)
		if res.StatusCode != 302 {
			t.Errorf("get() = %d, want %d", res.StatusCode, 302)
		}
		defer res.Body.Close()
		data, err := io.ReadAll(res.Body)
		if err != nil {
			t.Fatal(err)
		}
		expected := fmt.Sprintf("<a href=\"%s\">Found</a>.\n\n", uniqueUrl)
		if string(data) != expected {
			t.Errorf("get() = %q, want %q", data, expected)
		}
	})

	t.Run("delete", func(t *testing.T) {
		payload := fmt.Sprintf(`{"code":%q,"etag":%q}`, code, etag)
		res := testHandlerFunc("DELETE", "/", strings.NewReader(payload), delete)
		if res.StatusCode != 200 {
			t.Errorf("delete() = %d, want %d", res.StatusCode, 200)
		}
		var response map[string]bool
		if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
			t.Fatal(err)
		}
		if response["delete"] != true {
			t.Errorf("delete() = %v, want %v", response["delete"], true)
		}
	})
}
