package detector

import (
	"bytes"
	"strings"
	"sync"
)

type StringDetector struct {
	Target   string
	Callback func()

	buf  bytes.Buffer
	lock sync.Mutex
}

func (s *StringDetector) Write(p []byte) (n int, err error) {
	s.lock.Lock()
	defer s.lock.Unlock()
	n, err = s.buf.Write(p)
	for {
		b := s.buf.Bytes()
		if bytes.IndexByte(b, '\n') == -1 {
			break
		}

		line, _ := s.buf.ReadString('\n') // Ignore the error
		if strings.Contains(line, s.Target) {
			s.Callback()
		}
	}
	return n, err
}
