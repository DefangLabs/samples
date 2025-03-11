package store

import (
	"context"
	"testing"
)

func testCRUD(t *testing.T, table Table) {
	t.Helper()

	const noun = "testCRUD"
	t.Cleanup(func() { table.DeleteEntity(context.Background(), noun, LastWriteWins) })

	var etag ETag
	t.Run("create", func(t *testing.T) {
		var err error
		etag, err = table.InsertEntity(context.Background(), noun, Entity{"url": "http://google.com/asdf"})
		if err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}
		if etag == "" {
			t.Errorf("Expected an etag, got empty string")
		}
	})

	t.Run("create again xfail", func(t *testing.T) {
		etag, err := table.InsertEntity(context.Background(), noun, Entity{"url": "http://google.com/shouldhavefailed"})
		if err == nil {
			t.Fatalf("Expected an error, got nil")
		}
		if etag != "" {
			t.Errorf("Expected empty etag, got: %q", etag)
		}
	})

	t.Run("retrieve", func(t *testing.T) {
		e, etagx, err := table.RetrieveEntity(context.Background(), noun)
		if err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}
		if len(e) == 0 {
			t.Errorf("Expected entity, got empty map")
		}
		if e["url"] != "http://google.com/asdf" {
			t.Errorf("Expected url to be http://google.com/asdf, got: %q", e["url"])
		}
		if etagx != etag {
			t.Errorf("Expected etag to be %q, got: %q", etag, etagx)
		}
		etag = etagx // avoid error in next test
	})

	t.Run("retrieve nonexistent", func(t *testing.T) {
		e, etagx, err := table.RetrieveEntity(context.Background(), "bogus")
		if err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}
		if len(e) != 0 {
			t.Errorf("Expected empty map, got: %v", e)
		}
		if etagx != "" {
			t.Errorf("Expected empty etag, got: %q", etagx)
		}
	})

	t.Run("update wrong etag xfail", func(t *testing.T) {
		etag, err := table.ReplaceEntity(context.Background(), noun, Entity{"url": "http://google.com/asdfy"}, "bogus")
		if err == nil {
			t.Fatalf("Expected an error, got nil")
		}
		if etag != "" {
			t.Errorf("Expected empty etag, got: %q", etag)
		}
	})

	t.Run("update", func(t *testing.T) {
		var err error
		prevEtag := etag
		etag, err = table.ReplaceEntity(context.Background(), noun, Entity{"url": "http://google.com/asdfy"}, etag)
		if err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}
		if etag == "" {
			t.Errorf("Expected an etag, got empty string")
		}
		if etag == prevEtag {
			t.Errorf("Expected different etags, got the same one twice")
		}
		_, etag, _ = table.RetrieveEntity(context.Background(), noun) // avoid error in next test
	})

	t.Run("update last-write-wins", func(t *testing.T) {
		t.Skip("TODO: not working in Dapr")
		var err error
		prevEtag := etag
		etag, err = table.ReplaceEntity(context.Background(), noun, Entity{"url": "http://google.com/asdfz"}, LastWriteWins)
		if err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}
		if etag == "" {
			t.Errorf("Expected an etag, got empty string")
		}
		if etag == prevEtag {
			t.Errorf("Expected different etags, got the same one twice")
		}
	})

	t.Run("delete wrong etag xfail", func(t *testing.T) {
		if err := table.DeleteEntity(context.Background(), noun, "bogus"); err == nil {
			t.Fatalf("Expected an error, got nil")
		}
	})

	t.Run("delete", func(t *testing.T) {
		if err := table.DeleteEntity(context.Background(), noun, etag); err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}
	})

	t.Run("delete again xfail", func(t *testing.T) {
		t.Skip("not supported by Dapr")
		if err := table.DeleteEntity(context.Background(), noun, etag); err == nil {
			t.Fatalf("Expected an error, got nil")
		}
	})

	t.Run("delete last-write-wins", func(t *testing.T) {
		t.Skip("TODO: unimplemented")
		if err := table.DeleteEntity(context.Background(), noun, LastWriteWins); err == nil {
			t.Fatalf("Expected an error, got nil")
		}
	})
}
