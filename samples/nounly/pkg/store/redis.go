package store

import (
	"context"
	"math/rand"
	"strconv"

	"github.com/redis/go-redis/v9"
)

type RedisTable struct {
	client redis.UniversalClient
}

const etagKey = "_etag"

var _ Table = RedisTable{}

func NewRedisTable(addr ...string) RedisTable {
	return RedisTable{redis.NewUniversalClient(&redis.UniversalOptions{
		Addrs:      addr,
		MaxRetries: 2,
	})}
}

func (rdb RedisTable) DeleteEntity(ctx context.Context, key string, etag ETag) error {
	if etag != LastWriteWins {
		prevEtag, err := rdb.client.HGet(ctx, key, etagKey).Result()
		if err != nil {
			return err
		}
		if prevEtag != string(etag) {
			return ErrEtagMismatch
		}
	}
	// No need to use tx here since the etag matches so we own the key
	return rdb.client.Del(ctx, key).Err() // TODO: avoid multiple roundtrips
}

func (rdb RedisTable) RetrieveEntity(ctx context.Context, key string) (Entity, ETag, error) {
	e, err := rdb.client.HGetAll(ctx, key).Result()
	return e, ETag(e[etagKey]), err
}

func (rdb RedisTable) ReplaceEntity(ctx context.Context, key string, e Entity, etag ETag) (ETag, error) {
	if etag == LastWriteWins {
		return putEntity(ctx, rdb.client, key, e)
	}
	return rdb.hsetIfMatch(ctx, etag, key, e)
}

func (rdb RedisTable) InsertEntity(ctx context.Context, key string, e Entity) (ETag, error) {
	return rdb.hsetIfMatch(ctx, "", key, e)
}

func putEntity(ctx context.Context, tx redis.Cmdable, key string, values ...any) (ETag, error) {
	etag := newEtag()
	_, err := tx.Pipelined(ctx, func(pipe redis.Pipeliner) error {
		tx.HSet(ctx, key, values...) // TODO: check err
		return tx.HSet(ctx, key, etagKey, string(etag)).Err()
	})
	return etag, err
}

func (rdb RedisTable) hsetIfMatch(ctx context.Context, etag ETag, key string, values ...any) (ETag, error) {
	// if etag == "*" {
	// 	panic("invalid etag")
	// }
	var newEtag ETag
	err := rdb.client.Watch(ctx, func(tx *redis.Tx) error {
		prevEtag, err := tx.HGet(ctx, key, etagKey).Result()
		if err != nil && err != redis.Nil {
			return err
		}
		if etag != ETag(prevEtag) {
			return ErrEtagMismatch
		}
		// TODO: avoid multiple roundtrips
		newEtag, err = putEntity(ctx, tx, key, values...)
		return err
	}, key)
	return newEtag, err
}

func newEtag() ETag {
	return ETag(strconv.FormatInt(rand.Int63(), 36))
}
