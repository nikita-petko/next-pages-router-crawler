package daemon

import (
	"time"

	"github.com/golang/glog"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/flags"
)

// Run runs the doWork func in a loop as well
// as initializes the context.
// Can only occur once.
func Run() {
	glog.Infof("Start work with %s interval.", *flags.Interval)

	for {
		DoWork()

		time.Sleep(*flags.Interval)
	}
}
