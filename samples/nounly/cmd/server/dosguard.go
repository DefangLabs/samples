package main

import (
	"os"
	"time"

	"github.com/lionello/nounly-go/pkg/antispam"
)

var (
	projectHoneyPotKey = os.Getenv("PROJECT_HONEYPOT_KEY")
	cache              = make(map[string]time.Time) // FIXME: use redis
)

const (
	domainBlockList     = "dbl.spamhaus.org" // TODO: use <key>.zen.spamhaus.org
	projectHoneyPotHost = "dnsbl.httpbl.org"
	dosTime             = 20 * time.Second
	BlockListTime       = 24 * time.Hour
	difficultyBits      = 13 // make sure this matches the difficulty in app.js
)

func CheckDomainBlockList(hostname string) bool {
	return antispam.CheckDomainBlockList(hostname, domainBlockList)
}

// Returns 'true' if the specified IP is known to be from a spammer.
func isKnownSpammer(ip string) bool {
	return antispam.CheckSpamBlockList(ip, projectHoneyPotHost, projectHoneyPotKey)
}

func addCache(key string, ts time.Duration) bool {
	_, wasCached := cache[key]
	cache[key] = time.Now().Add(ts)
	return wasCached
}

func queryCache(key string) bool {
	exp, ok := cache[key]
	return ok && exp.After(time.Now())
}

func queryCacheDoS(ip string) bool {
	return queryCache(ip)
}

func addCacheDoS(ip string, ts time.Duration) bool {
	return addCache(ip, ts)
}

func addToBlockList(ip string) bool {
	return addCache("BL:"+ip, BlockListTime)
}

func CheckForDenialOfService(ip string) bool {
	inCache := queryCacheDoS(ip)
	if !inCache {
		prevValueBL := addToBlockList(ip)
		if !prevValueBL {
			// First time; check Deny listing
			return checkForSpammer(ip)
		}
		// Already allowed
		addCacheDoS(ip, dosTime)
	}

	// Deny (return true) if the item was previously stored in the cache
	return inCache
}

func checkForSpammer(ip string) bool {
	spam := isKnownSpammer(ip)
	if spam {
		// Force DOS for the next day
		addCacheDoS(ip, BlockListTime)
	} else {
		// Already added to the BL: cache (whitelisted)
		addCacheDoS(ip, dosTime)
	}
	return spam
}
