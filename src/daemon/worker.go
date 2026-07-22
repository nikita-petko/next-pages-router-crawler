package daemon

import (
	"context"
	"time"

	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/flags"
)

func doWork(ctx context.Context) {
	for {
		time.Sleep(*flags.Interval)
	}
}
