package main

import (
	"flag"
	"os"
	"os/signal"
	"syscall"

	"github.com/golang/glog"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/alerting"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/cache"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/daemon"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/flags"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/http"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/sourcemap"
)

var applicationName string
var buildMode string
var commitSha string

// Pre-setup, runs before main.
func init() {
	flags.SetupFlags(applicationName, buildMode, commitSha)
}

// Main entrypoint.
func main() {
	if *flags.HelpFlag {
		flag.Usage()

		return
	}

	http.Setup()
	cache.Setup()
	sourcemap.SetupOutput()
	alerting.Setup()

	if *flags.Pulse {
		daemon.DoWork()
		defer cache.Close()

		return
	}

	go daemon.Run()

	// Wait for a signal to quit
	daemon.CloseSignal = make(chan os.Signal, 1)

	// We want to catch ALL signals to quit
	signal.Notify(daemon.CloseSignal, syscall.SIGABRT, syscall.SIGINT, syscall.SIGTERM)
	defer func() {
		sig := <-daemon.CloseSignal

		cache.Close()
		glog.Flush()

		close(daemon.CloseSignal)

		glog.Warningf("Received signal %s, exiting\n", sig)

		os.Exit(0)
	}()
}
