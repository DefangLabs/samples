package store

import (
	"context"
)

type MockTable map[string]Entity

var _ Table = MockTable{}

func (m MockTable) DeleteEntity(ctx context.Context, key string, etag ETag) error {
	if etag != LastWriteWins {
		e := m[key]
		if e == nil || e[etagKey] != string(etag) {
			return ErrEtagMismatch
		}
	}
	delete(m, key)
	return nil
}

func (m MockTable) RetrieveEntity(ctx context.Context, key string) (Entity, ETag, error) {
	e := m.hgetall(key)
	return e, ETag(e[etagKey]), nil
}

func (m MockTable) ReplaceEntity(ctx context.Context, key string, e Entity, etag ETag) (ETag, error) {
	if etag == LastWriteWins {
		return m.putEntity(key, e), nil
	}
	return m.hsetIfMatch(etag, key, e)
}

func (m MockTable) InsertEntity(ctx context.Context, key string, e Entity) (ETag, error) {
	return m.hsetIfMatch("", key, e)
}

func (m MockTable) putEntity(key string, e Entity) ETag {
	etag := newEtag()
	e[etagKey] = string(etag)
	m[key] = e
	return etag
}

func (m MockTable) hsetIfMatch(etag ETag, key string, e Entity) (ETag, error) {
	prev := m.hgetall(key)
	if prev[etagKey] != string(etag) {
		return "", ErrEtagMismatch
	}
	return m.putEntity(key, e), nil
}

func (m MockTable) hgetall(key string) Entity {
	e, ok := m[key]
	if !ok {
		return Entity{}
	}
	return e
}
