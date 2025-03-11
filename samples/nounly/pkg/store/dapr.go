package store

import (
	"context"
	"encoding/json"
	"strconv"

	"github.com/dapr/components-contrib/metadata"
	"github.com/dapr/components-contrib/state"
	"github.com/dapr/components-contrib/state/aws/dynamodb"
	"github.com/dapr/components-contrib/state/redis"
)

type DaprStore struct {
	dapr state.Store
}

var _ Table = &DaprStore{}

func NewDaprRedisStateStore(ctx context.Context, redisHost string) DaprStore {
	r := redis.NewRedisStateStore(nil)                                           // no logger
	base := metadata.Base{Properties: map[string]string{"redisHost": redisHost}} // TODO: pass in metadata (addresses, etc.)
	if err := r.Init(ctx, state.Metadata{Base: base}); err != nil {
		panic(err) // TODO: return error
	}
	return DaprStore{r}
}

func NewDaprDynamoStateStore(ctx context.Context, tableName string) DaprStore {
	r := dynamodb.NewDynamoDBStateStore(nil) // no logger
	if err := r.Init(ctx, state.Metadata{Base: metadata.Base{Properties: map[string]string{
		// "AccessKey":        `json:"accessKey" mapstructure:"accessKey" mdignore:"true"`,
		// "SecretKey":        `json:"secretKey" mapstructure:"secretKey" mdignore:"true"`,
		// "SessionToken":     `json:"sessionToken"  mapstructure:"sessionToken" mdignore:"true"`,
		// "Region": "us-west-2",
		// "Endpoint":         `json:"endpoint"`,
		"Table": tableName,
		// "TTLAttributeName": `json:"ttlAttributeName"`,
		// "PartitionKey":     `json:"partitionKey"`,
	}}}); err != nil { // TODO: pass in metadata (addresses, etc.)
		panic(err) // TODO: return error
	}
	return DaprStore{r}
}

func (d DaprStore) InsertEntity(ctx context.Context, key string, e Entity) (ETag, error) {
	err := d.dapr.Set(ctx, &state.SetRequest{
		Key:   key,
		Value: e,
		Options: state.SetStateOption{
			Concurrency: state.FirstWrite,
		},
	})
	if err != nil {
		return "", err
	}
	// Dapr doesn't return the new etag, so we start with 1 FIXME: this only works for Redis!
	return ETag("1"), nil
}

func (d DaprStore) RetrieveEntity(ctx context.Context, key string) (e Entity, etag ETag, err error) {
	resp, err := d.dapr.Get(ctx, &state.GetRequest{
		Key: key,
	})
	if err != nil {
		return nil, "", err
	}
	e = make(Entity)
	if len(resp.Data) == 0 {
		return e, "", nil
	}
	return e, ETag(*resp.ETag), json.Unmarshal(resp.Data, &e)
}

func (d DaprStore) ReplaceEntity(ctx context.Context, key string, e Entity, etag ETag) (ETag, error) {
	etagStr := string(etag)
	if etag == LastWriteWins {
		panic("not implemented")
	}
	err := d.dapr.Set(ctx, &state.SetRequest{
		ETag:  &etagStr,
		Key:   key,
		Value: e,
		Options: state.SetStateOption{
			Concurrency: state.FirstWrite,
		},
	})
	if err != nil {
		return "", err
	}
	// Dapr doesn't return the new etag, so we have to increment it ourselves FIXME: this only works for Redis!
	ver, _ := strconv.Atoi(string(etag))
	return ETag(strconv.Itoa(ver + 1)), nil
}

func (d DaprStore) DeleteEntity(ctx context.Context, key string, etag ETag) error {
	var etagStr = string(etag)
	return d.dapr.Delete(ctx, &state.DeleteRequest{
		Key:  key,
		ETag: &etagStr,
		// Options: state.DeleteStateOption{
		// 	Concurrency: state.FirstWrite, unused?!?
		// },
	})
}
