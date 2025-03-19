package router

import (
	"net/http"
	"regexp"
)

// From https://benhoyt.com/writings/go-routing/#regex-table

type Route struct {
	method  string
	regex   *regexp.Regexp
	handler http.HandlerFunc
}

func NewRoute(method, pattern string, handler http.HandlerFunc) Route {
	return Route{method, regexp.MustCompile("^" + pattern + "$"), handler}
}
