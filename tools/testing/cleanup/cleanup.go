package cleanup

import (
	"errors"
	"sync"
)

type CleanUpFunc func() error

var defaultCleanUp = &CleanUp{}

func Add(fn CleanUpFunc) {
	defaultCleanUp.Add(fn)
}

func Run() error {
	return defaultCleanUp.Run()
}

type CleanUp struct {
	cleanups []CleanUpFunc
	lock     sync.Mutex
}

func (c *CleanUp) Add(fn CleanUpFunc) {
	c.lock.Lock()
	defer c.lock.Unlock()
	c.cleanups = append(c.cleanups, fn)
}

func (c *CleanUp) Run() error {
	c.lock.Lock()
	defer c.lock.Unlock()
	var errs []error
	// Run the clean up functions in reverse order
	for i := len(c.cleanups) - 1; i >= 0; i-- {
		if err := c.cleanups[i](); err != nil {
			errs = append(errs, err)
		}
	}
	return errors.Join(errs...)
}
