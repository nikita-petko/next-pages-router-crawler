package types

type SourceMapSection struct {
	// Map is a mapping of source file paths to their corresponding contents.
	Map *SourceMap `json:"map"`
}

// SourceMap contains only the required keys for the source map.
type SourceMap struct {
	// Sources is a list of source files that the source map refers to.
	Sources []string `json:"sources"`

	// SourcesContent is a list of source file contents that the source map refers to.
	SourcesContent []string `json:"sourcesContent"`

	// Sections is a list of sections that the source map refers to.
	// Note: Not all source maps have sections, so this field is optional.
	Sections []*SourceMapSection `json:"sections,omitempty"`
}
