package store

import "testing"

func TestMockTable(t *testing.T) {
	testCRUD(t, MockTable{})
}
