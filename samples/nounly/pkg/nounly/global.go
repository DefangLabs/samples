package nounly

import (
	"context"
	"log"
	"math/rand"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/lionello/nounly-go/pkg/store"
)

type Token string // our "etag"

func newToken() Token {
	return Token(strconv.FormatInt(rand.Int63(), 36))
}

var customUrl string
var stinkyURLs map[string]bool

func init() {
	if envUrl := os.Getenv("DEFANG_FQDN"); envUrl != "" {
		customUrl = envUrl
	} else {
		customUrl = "noun.ly"
	}

	stinkyURLs = map[string]bool{
		"noun.ly":           true,
		"www.noun.ly":       true,
		"nounly.com":        true,
		"www.nounly.com":    true,
		"stinkybad.com":     true,
		"www.stinkybad.com": true,
		customUrl:           true,
	}
}

const (
	initialExpiry = 24 * time.Hour
	clickExpiry   = 30 * time.Minute
)

var Table store.Table = store.NewRedisTable(os.Getenv("REDIS"))

func GetUrl(ctx context.Context, code string, user string) string {
	code = normalizeCode(code)
	cw, etag, err := Table.RetrieveEntity(ctx, code)
	if err != nil {
		panic(err)
	}
	if len(cw) == 0 {
		return "" // not found
	}
	prevExpiry, err := time.Parse(time.RFC3339Nano, cw["expiry"])
	if err != nil {
		panic(err) // invalid expiry time
	}
	newExpiry := time.Now().UTC().Add(clickExpiry)
	if newExpiry.After(prevExpiry) && user != cw["user"] {
		cw["user"] = user
		cw["expiry"] = newExpiry.Format(time.RFC3339Nano)
		// TODO: avoid multiple roundtrips
		if _, err := Table.ReplaceEntity(ctx, code, cw, etag); err != nil {
			panic(err)
		}
	}
	return cw["url"]
}

func normalizeCode(code string) string {
	return strings.ToLower(strings.ReplaceAll(code, " ", ""))
}

func DeleteCode(ctx context.Context, code string, token Token) bool {
	code = normalizeCode(code)
	e, etag, _ := Table.RetrieveEntity(ctx, code)
	if e["token"] != string(token) {
		return false
	}
	if err := Table.DeleteEntity(ctx, code, etag); err != nil {
		log.Printf("Error deleting %q etag=%q: %v", code, etag, err)
		return false
	}
	return true
}

func isStinkyUri(uri string) string {
	u, err := url.ParseRequestURI(uri)
	if err != nil {
		log.Printf("Error parsing %q: %v", uri, err)
		return ""
	}
	if len(u.Path) < 3 || !stinkyURLs[strings.ToLower(u.Hostname())] {
		return ""
	}
	return u.Path[1:]
}

func NormalizeForHeader(uri string) string {
	// TODO: remove default port
	if strings.Contains(uri, "://") {
		return uri
	}
	return "http://" + uri
}

func CreateCode(ctx context.Context, uri string, user string, title string) (string, Token) {
	uri = NormalizeForHeader(uri)

	code := isStinkyUri(uri)
	if code != "" {
		return code, ""
	}

	if title == "" {
		title = uri
	}
	var etag *Token
	var err error
	noun := GetIncrementallyLongCodes(uri, func(n string) bool {
		etag, err = tryAdd(ctx, normalizeCode(n), uri, user)
		if err != nil {
			panic(err)
		}
		return etag != nil
	})
	return noun, *etag
}

func tryAdd(ctx context.Context, codestr string, url string, user string) (*Token, error) {
	created := time.Now().UTC()
	prev, etag, err := Table.RetrieveEntity(ctx, codestr)
	if err != nil {
		return nil, err
	}
	if len(prev) == 0 {
		// Not found; insert it now (this shouldn't happen often)
		token := newToken()
		m := store.Entity{
			"token":   string(token),
			"url":     url,
			"user":    user,
			"created": created.Format(time.RFC3339Nano),
			"expiry":  created.Add(initialExpiry).Format(time.RFC3339Nano),
		}
		_, err := Table.InsertEntity(ctx, codestr, m)
		return &token, err
	}
	// Found the word(s)! (this is the usual case)
	prevExpiry, err := time.Parse(time.RFC3339Nano, prev["expiry"])
	if err != nil {
		panic(err)
	}

	// Four options(*):
	// 1*. the word is expired: recreate (return etag)
	// 2. the word is not expired: (return empty)
	//  a. same url: update the expiry time
	//   *. same ip: NOP
	//   *. diff ip: extend the expiry by "1 day"
	//  b*. different url: try another word (return null)

	// Check the expiry time.
	if prevExpiry.Before(created) {
		// 1*. Expired; recreate and return the ETag TODO: dedup
		token := newToken()
		m := store.Entity{
			"token":   string(token),
			"url":     url,
			"user":    user,
			"created": created.Format(time.RFC3339Nano),
			"expiry":  created.Add(initialExpiry).Format(time.RFC3339Nano),
		}
		_, err = Table.ReplaceEntity(ctx, codestr, m, etag) // overwrite
		if err != nil {
			return nil, err
		}
		return &token, nil
	}

	const reuse = true
	if reuse && prev["url"] == url {
		if prev["user"] != user {
			// 2a*. Not expired, same url, different user: extend the expiry
			prev["user"] = user
			prev["expiry"] = created.Add(clickExpiry).Format(time.RFC3339Nano)
			_, err := Table.ReplaceEntity(ctx, codestr, prev, etag)
			if err != nil {
				return nil, err
			}
		}
		return new(Token), nil
	}

	// 2b*. Not expired, different url: try another word
	return nil, nil
}
