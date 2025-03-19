package store

import (
	"context"
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
)

func TestNewEtag(t *testing.T) {
	etag := newEtag()
	if etag == "" {
		t.Errorf("Expected an etag, got empty string")
	}
	if etag == newEtag() {
		t.Errorf("Expected different etags, got the same one twice")
	}
}

func TestRedisCRUD(t *testing.T) {
	rdb := miniredis.RunT(t)

	client := redis.NewClient(&redis.Options{Addr: rdb.Addr()})
	if err := client.FlushDB(context.Background()).Err(); err != nil {
		panic(err)
	}

	testCRUD(t, NewRedisTable(rdb.Addr()))
}
