package main

import (
	"context"
	"net"
	"net/http"
	"testing"
	"time"
)

func TestServe(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	lis, err := net.Listen("tcp", "localhost:0")
	if err != nil {
		t.Fatalf("Failed to listen: %v", err)
	}
	t.Cleanup(func() { lis.Close() })

	go func() {
		time.Sleep(100 * time.Millisecond)
		cancel()
	}()

	if err := serve(ctx, lis); err != nil && err != http.ErrServerClosed {
		t.Fatalf("serve() returned an error: %v", err)
	}
}
