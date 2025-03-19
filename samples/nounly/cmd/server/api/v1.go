package api

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/lionello/nounly-go/pkg/nounly"
)

type getReply struct {
	Url string `json:"url"`
}

// type errorReply struct { TODO: use this
// 	Error string `json:"error"`
// }

func Get(w http.ResponseWriter, r *http.Request) {
	if !checkAuth(r) {
		http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		return
	}
	w.Header().Set("Cache-Control", "no-cache")
	noun := strings.TrimPrefix(r.URL.Path, "/")
	url := nounly.GetUrl(r.Context(), noun, GetClientIP(r))
	if err := json.NewEncoder(w).Encode(getReply{Url: url}); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError) // TODO: might leak internal info
		return
	}
}

type postRequest struct {
	Uri   string `json:"uri"` // required
	Etag  string `json:"etag,omitempty"`
	Title string `json:"title,omitempty"`
}

type postReply struct {
	Code string `json:"code"`
	Etag string `json:"etag,omitempty"`
}

func Post(w http.ResponseWriter, r *http.Request) {
	if !checkAuth(r) {
		http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		return
	}
	w.Header().Set("Cache-Control", "no-cache")
	var req postRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest) // TODO: might leak internal info
		return
	}
	code, etag := nounly.CreateCode(r.Context(), req.Uri, GetClientIP(r), req.Title)
	if err := json.NewEncoder(w).Encode(postReply{Code: code, Etag: string(etag)}); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError) // TODO: might leak internal info
		return
	}
}

// func PostExisting(w http.ResponseWriter, r *http.Request) {
// 	if !checkAuth(r) {
// 		http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
// 		return
// 	}
// 	w.Header().Set("Cache-Control", "no-cache")
// 	var req postRequest
// 	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
// 		http.Error(w, err.Error(), http.StatusBadRequest) // TODO: might leak internal info
// 		return
// 	}
// 	code, etag := nounly.RecreateCode(r.Context(), req.Uri, GetClientIP(r), req.Title)
// 	if err := json.NewEncoder(w).Encode(postReply{Code: code, Etag: string(etag)}); err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError) // TODO: might leak internal info
// 		return
// 	}
// }

type deleteRequest struct {
	ETag string `json:"etag"`
}

func Delete(w http.ResponseWriter, r *http.Request) {
	if !checkAuth(r) {
		http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		return
	}
	w.Header().Set("Cache-Control", "no-cache")
	var req deleteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest) // TODO: might leak internal info
		return
	}
	noun := strings.TrimPrefix(r.URL.Path, "/")
	if !nounly.DeleteCode(r.Context(), noun, nounly.Token(req.ETag)) {
		http.NotFound(w, r)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type statusReply struct {
	User string `json:"user"`
}

func Status(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-cache")
	if err := json.NewEncoder(w).Encode(statusReply{User: GetClientIP(r)}); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError) // TODO: might leak internal info
		return
	}
}
