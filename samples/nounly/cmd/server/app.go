package main

import (
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/lionello/nounly-go/cmd/server/api"
	"github.com/lionello/nounly-go/pkg/antispam"
	"github.com/lionello/nounly-go/pkg/nounly"
)

var returnedUrl string

func get(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-cache")
	noun := strings.TrimPrefix(r.URL.Path, "/")
	url := nounly.GetUrl(r.Context(), noun, api.GetClientIP(r))
	if url == "" {
		http.Redirect(w, r, "/?"+noun, http.StatusFound)
		return
	}
	http.Redirect(w, r, url, http.StatusFound) // TODO: urlEncode?
}

type postRequest struct {
	Url   string  `json:"url"` // required
	Etag  string  `json:"etag,omitempty"`
	Nonce float64 `json:"nonce,omitempty"`
	Date  string  `json:"date,omitempty"`
}

type postReply struct {
	Url  string `json:"url"`
	Code string `json:"code"`
	Etag string `json:"etag,omitempty"`
}

func post(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body) // TODO: limit size
	if err != nil || len(body) > 1024 {
		http.Error(w, `{"error":"Invalid body"}`, http.StatusBadRequest)
		return
	}

	if CheckForDenialOfService(api.GetClientIP(r)) {
		if !antispam.CheckProofOfWork(body, difficultyBits) {
			http.Error(w, `{"error":"The server is busy"}`, http.StatusTooManyRequests)
			return
		}
	}

	var req postRequest
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, `{"error":"Invalid JSON"}`, http.StatusBadRequest)
		return
	}

	if !api.VerifyDate(req.Date, time.Now()) {
		http.Error(w, `{"error":"Invalid date"}`, http.StatusBadRequest)
		return
	}

	url, err := url.ParseRequestURI(nounly.NormalizeForHeader(req.Url))
	if err != nil {
		http.Error(w, `{"error":"Invalid URL"}`, http.StatusBadRequest)
		return
	}
	if CheckDomainBlockList(url.Hostname()) {
		http.Error(w, `{"error":"This URL has been block-listed."}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Cache-Control", "no-cache")

	if envUrl := os.Getenv("DEFANG_FQDN"); envUrl != "" {
		returnedUrl = "http://" + envUrl + "/"
	} else {
		returnedUrl = "http://noun.ly/"
	}

	code, etag := nounly.CreateCode(r.Context(), req.Url, api.GetClientIP(r), req.Url)
	if err := json.NewEncoder(w).Encode(postReply{Url: returnedUrl + code, Code: code, Etag: string(etag)}); err != nil {
		panic(err)
	}
}

type deleteRequest struct {
	Code string `json:"code"`
	ETag string `json:"etag"`
}

type deleteReply struct {
	Delete bool `json:"delete"`
}

func delete(w http.ResponseWriter, r *http.Request) {
	var req deleteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid JSON"}`, http.StatusBadRequest)
		return
	}
	del := nounly.DeleteCode(r.Context(), req.Code, nounly.Token(req.ETag))
	if err := json.NewEncoder(w).Encode(deleteReply{Delete: del}); err != nil {
		panic(err)
	}
}
