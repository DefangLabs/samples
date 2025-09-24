package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"

	"github.com/lionello/nounly-go/cmd/server/api"
	"github.com/lionello/nounly-go/pkg/router"
)

var (
	port, _ = strconv.Atoi(os.Getenv("PORT"))
	version = "development" // overwritten by build script -ldflags="-X main.version=..."
	// log     = log.New(os.Stdout, "server: ", log.LstdFlags|log.Lshortfile)
)

const nounRegex = "([a-zA-Z -]+)" // only ASCII letters, spaces and hyphens

func serve(ctx context.Context, lis net.Listener) error {
	server := &http.Server{
		Handler: router.Routes{
			router.NewRoute("GET", "/"+nounRegex, get),
			router.NewRoute("POST", "/", post),
			router.NewRoute("DELETE", "/", delete),
			router.NewRoute("GET", "/v1/status", api.Status),
			router.NewRoute("GET", "/v1/"+nounRegex, api.Get),
			router.NewRoute("POST", "/v1/", api.Post),
			// router.NewRoute("POST", "/v1/"+nounRegex, api.PostExisting),
			router.NewRoute("DELETE", "/v1/"+nounRegex, api.Delete),
			// Serve static files from /public
			router.NewRoute("GET", "/.*", http.FileServer(http.Dir("public")).ServeHTTP),
		},
	}

	// Register signal handler for graceful shutdown
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, os.Interrupt, syscall.SIGTERM)
	defer signal.Stop(sigs)

	go func() {
		if err := server.Serve(lis); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server Serve: %v\n", err)
		}
	}()

	log.Printf("Server %s listening at %v\n", version, lis.Addr())
	select {
	case <-ctx.Done():
		log.Printf("Context canceled: %v\n", ctx.Err())
	case sig := <-sigs:
		log.Printf("Received signal %v, shutting down...\n", sig)
	}
	return server.Shutdown(ctx)
}

func main() {
	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
	if err != nil {
		log.Fatalf("failed to listen: %v\n", err)
	}

	if err := serve(context.Background(), lis); err != nil {
		log.Fatalf("failed to serve: %v\n", err)
	}
}
