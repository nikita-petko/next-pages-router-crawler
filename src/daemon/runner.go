package daemon

import (
	"context"
	"sync"

	"github.com/golang/glog"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/flags"
)

var (
	gRunOnceFlag sync.Once
)

// Run runs the doWork func in a loop as well
// as initializes the context.
// Can only occur once.
func Run() {
	gRunOnceFlag.Do(func() {
		ctx := context.Background()

		glog.Infof("Start work with %s interval.", *flags.Interval)

		go doWork(ctx)
	})
}
