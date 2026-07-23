package types

// NextData contains the needed data from the __NEXT_DATA__ script tag in the initial HTML document.
// Which is used to derive the build manifest location and asset prefix without having
// to search for the script tag in the HTML document.
type NextData struct {
	// BuildId is the build identifier for the Next.js application. It is used to locate the build manifest and other assets.
	BuildId string `json:"buildId"`

	// AssetPrefix is the prefix for the assets in the Next.js application. It is used to locate the assets in the build manifest.
	AssetPrefix string `json:"assetPrefix"`
}
