package logger

import "os"

type Logger interface {
	Print(v ...interface{})
	Printf(format string, v ...interface{})
	Println(v ...interface{})
	Fatal(v ...interface{})
	Fatalf(format string, v ...interface{})
}

type MultiLogger struct {
	loggers []Logger
}

func NewMultiLogger(loggers ...Logger) *MultiLogger {
	return &MultiLogger{loggers: loggers}
}

func (m *MultiLogger) Print(v ...interface{}) {
	for _, l := range m.loggers {
		l.Print(v...)
	}
}

func (m *MultiLogger) Printf(format string, v ...interface{}) {
	for _, l := range m.loggers {
		l.Printf(format, v...)
	}
}

func (m *MultiLogger) Println(v ...interface{}) {
	for _, l := range m.loggers {
		l.Println(v...)
	}
}

func (m *MultiLogger) Fatal(v ...interface{}) {
	for _, l := range m.loggers {
		l.Fatal(v...)
	}
	os.Exit(1)
}

func (m *MultiLogger) Fatalf(format string, v ...interface{}) {
	for _, l := range m.loggers {
		l.Printf(format, v...)
	}
	os.Exit(1)
}
