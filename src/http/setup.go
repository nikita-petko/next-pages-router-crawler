package http

import "github.com/hashicorp/go-retryablehttp"

var httpClient = retryablehttp.NewClient()

func Setup() {
	httpClient.Logger = &glogAdapter{}
}
