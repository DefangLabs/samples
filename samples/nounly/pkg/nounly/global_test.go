//go:build integration

package nounly

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/lionello/nounly-go/pkg/store"
)

func TestMain(m *testing.M) {
	table = store.NewDaprDynamoStateStore(context.Background(), "nounly-test")
	os.Exit(m.Run())
}

func TestGetUrl(t *testing.T) {
	const noun = "testgeturl"
	t.Cleanup(func() { table.DeleteEntity(context.Background(), noun, store.LastWriteWins) })

	t.Run("nonexistent", func(t *testing.T) {
		if got := GetUrl(context.Background(), noun, "user1"); got != "" {
			t.Errorf("Expected empty string, got %q", got)
		}
	})

	t.Run("happy path", func(t *testing.T) {
		etag, err := tryAdd(context.Background(), noun, "http://google.com/asdf", "user1")
		if err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}
		if *etag == "" {
			t.Errorf("Expected an etag, got empty string")
		}
		if _, ok, _ := table.RetrieveEntity(context.Background(), noun); ok == "" {
			t.Errorf("Expected noun to exist, but it doesn't")
		}
		if got := GetUrl(context.Background(), noun, "user1"); got != "http://google.com/asdf" {
			t.Errorf("Expected http://google.com/asdf, got %q", got)
		}
	})
}

func TestDeleteCode(t *testing.T) {
	const noun = "testdeletecode"
	t.Cleanup(func() { table.DeleteEntity(context.Background(), noun, store.LastWriteWins) })

	etag, err := tryAdd(context.Background(), noun, "http://google.com/asdf", "user1")
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}
	if *etag == "" {
		t.Errorf("Expected an etag, got empty string")
	}
	t.Run("wrong etag", func(t *testing.T) {
		if DeleteCode(context.Background(), noun, "bogus") {
			t.Errorf("Expected DeleteCode to return false, got true")
		}
	})
	t.Run("correct etag", func(t *testing.T) {
		if !DeleteCode(context.Background(), noun, *etag) {
			t.Errorf("Expected DeleteCode to return true, got false")
		}
		if _, ok, _ := table.RetrieveEntity(context.Background(), noun); ok != "" {
			t.Errorf("Expected noun to be deleted, but it still exists")
		}
	})
	t.Run("already deleted", func(t *testing.T) {
		t.Skip("not supported on Dapr")
		if DeleteCode(context.Background(), noun, *etag) {
			t.Errorf("Expected DeleteCode to return false, got true")
		}
	})
}

func TestCreateCode(t *testing.T) {
	noun, etag := CreateCode(context.Background(), "http://google.com/asdf", "user1", "titlex")
	if noun == "" {
		t.Errorf("Expected a noun, got empty string")
	}
	t.Cleanup(func() { table.DeleteEntity(context.Background(), noun, store.LastWriteWins) })
	if etag == "" {
		t.Errorf("Expected an etag, got empty string")
	}
}

func TestIsStinkyUri(t *testing.T) {
	tdt := []struct {
		in  string
		out string
	}{
		{"", ""},
		{"http://nounly.com", ""},
		{"http://nounly.com/", ""},
		{"http://Nounly.com/cat", "cat"},
		{"http://google.com/asdf", ""},
	}
	for _, tt := range tdt {
		if got := isStinkyUri(tt.in); got != tt.out {
			t.Errorf("Expected %q, got %q", tt.out, got)
		}
	}
}

func TestNormalizeCode(t *testing.T) {
	if normalizeCode("foo BAR") != "foobar" {
		t.Errorf("Expected foobar, got %q", normalizeCode("foo BAR"))
	}
}

func TestTryAdd(t *testing.T) {
	const noun = "testtryadd"
	t.Cleanup(func() { table.DeleteEntity(context.Background(), noun, store.LastWriteWins) })

	t.Run("nonexistent; create", func(t *testing.T) {
		etag, err := tryAdd(context.Background(), noun, "http://google.com/asdf", "user1")
		if err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}
		if *etag == "" {
			t.Errorf("Expected an etag, got empty string")
		}
	})
	var prevExpiry string
	t.Run("expired; recreate", func(t *testing.T) {
		// overwrite the expiry time to be in the past
		e, etagx, err := table.RetrieveEntity(context.Background(), noun)
		if err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}
		e["expiry"] = "2000-01-01T00:00:00Z"
		if _, err = table.ReplaceEntity(context.Background(), noun, e, etagx); err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}

		etag, err := tryAdd(context.Background(), noun, "http://google.com/asdf", "user1")
		if err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}
		if *etag == "" {
			t.Errorf("Expected an etag, got empty string")
		}
		prev, _, err := table.RetrieveEntity(context.Background(), noun)
		if err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}
		prevExpiry = prev["expiry"]
		expiry, err := time.Parse(time.RFC3339Nano, prevExpiry)
		if err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}
		if time.Now().After(expiry) {
			t.Fatalf("Expected expiry to be in the future, but it's in the past")
		}
	})
	t.Run("not expired: same url, same user", func(t *testing.T) {
		etag, err := tryAdd(context.Background(), noun, "http://google.com/asdf", "user1")
		if err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}
		if *etag != "" {
			t.Errorf("Expected empty string, got %q", *etag)
		}
		new, _, err := table.RetrieveEntity(context.Background(), noun)
		if err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}
		if new["expiry"] != prevExpiry {
			t.Errorf("Expected expiry to stay the same, but it changed")
		}
	})
	t.Run("not expired: same url, diff user", func(t *testing.T) {
		etag, err := tryAdd(context.Background(), noun, "http://google.com/asdf", "user2")
		if err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}
		if *etag != "" {
			t.Errorf("Expected empty string, got %q", *etag)
		}
		new, _, err := table.RetrieveEntity(context.Background(), noun)
		if err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}
		if new["expiry"] == prevExpiry {
			t.Errorf("Expected expiry to change, but it didn't")
		}
	})
	t.Run("not expired: diff url", func(t *testing.T) {
		etag, err := tryAdd(context.Background(), noun, "http://google.com/asdf2", "user1")
		if err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}
		if etag != nil {
			t.Errorf("Expected nil, got %q", *etag)
		}
	})
}
