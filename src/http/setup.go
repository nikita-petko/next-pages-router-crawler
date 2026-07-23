package http

import "github.com/hashicorp/go-retryablehttp"

var client *retryablehttp.Client

func Setup() {
	client := retryablehttp.NewClient()
	client.Logger = &glogAdapter{}
}
