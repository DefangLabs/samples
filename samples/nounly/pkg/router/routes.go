package router

import (
	"context"
	"net/http"
	"strings"
)

// From https://benhoyt.com/writings/go-routing/#regex-table

type Routes []Route

func matchVerb(fromReq string, fromRoute string) bool {
	// Same behavior as Go 1.22 http.ServeMux: HEAD is allowed for GET routes
	return fromReq == fromRoute || (fromReq == "HEAD" && fromRoute == "GET")
}

func (routes Routes) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	var allow []string
	for _, route := range routes {
		matches := route.regex.FindStringSubmatch(r.URL.Path)
		if len(matches) > 0 {
			if !matchVerb(r.Method, route.method) {
				allow = append(allow, route.method)
				continue
			}
			ctx := context.WithValue(r.Context(), ctxKey, matches[1:])
			route.handler(w, r.WithContext(ctx))
			return
		}
	}
	if len(allow) > 0 {
		w.Header().Set("Allow", strings.Join(allow, ", "))
		http.Error(w, "405 method not allowed", http.StatusMethodNotAllowed)
		return
	}
	http.NotFound(w, r)
}

type key struct{}

var ctxKey = key{}

func GetFields(r *http.Request) []string {
	return r.Context().Value(ctxKey).([]string)
}
func GetField(r *http.Request, index int) string {
	return GetFields(r)[index]
}
