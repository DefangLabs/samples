//go:build integration

package store

import (
	"context"
	"testing"
)

func TestDaprRedis(t *testing.T) {
	testCRUD(t, NewDaprRedisStateStore(context.Background(), "localhost:6379")) // Dapr Redis does not support miniredis
}

func TestDaprDynamoDB(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping test in short mode.")
	}
	t.Setenv("AWS_PROFILE", "defang-sandbox")
	t.Setenv("AWS_REGION", "us-west-2")
	testCRUD(t, NewDaprDynamoStateStore(context.Background(), "nounly-test"))
}
