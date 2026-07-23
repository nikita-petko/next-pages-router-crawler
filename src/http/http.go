package http

import gohttp "net/http"

func Head(url string) (*gohttp.Response, error) {
	return gohttp.Head(url)
}

func Get(url string) (*gohttp.Response, error) {
	return client.Get(url)
}
