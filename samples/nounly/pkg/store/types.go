package store

import (
	"context"
	"errors"
)

type Table interface {
	InsertEntity(ctx context.Context, key string, e Entity) (ETag, error)             // C
	RetrieveEntity(ctx context.Context, key string) (Entity, ETag, error)             // R
	ReplaceEntity(ctx context.Context, key string, e Entity, etag ETag) (ETag, error) // U
	DeleteEntity(ctx context.Context, key string, etag ETag) error                    // D
}

type ETag string // TODO: make *string?

const LastWriteWins ETag = ""

var ErrEtagMismatch = errors.New("etag mismatch")

type Entity = map[string]string // TODO: make []byte?
