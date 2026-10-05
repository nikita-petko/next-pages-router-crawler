package http

import (
	"github.com/golang/glog"
	"github.com/hashicorp/go-retryablehttp"
)

var httpClient = retryablehttp.NewClient()

func Setup() {
	httpClient.Logger = &glogAdapter{}

	glog.Info("HTTP client setup complete")
}
