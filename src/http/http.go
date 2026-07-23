package http

import gohttp "net/http"

func Head(url string) (*gohttp.Response, error) {
	return httpClient.Head(url)
}

func Get(url string) (*gohttp.Response, error) {
	return httpClient.Get(url)
}
