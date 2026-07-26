# next-pages-router-crawler

[![Go Build](https://github.com/nikita-petko/next-pages-router-crawler/actions/workflows/build.yml/badge.svg)](https://github.com/nikita-petko/next-pages-router-crawler/actions/workflows/build.yml)
[![Build Docker Image](https://github.com/nikita-petko/next-pages-router-crawler/actions/workflows/build-docker.yml/badge.svg)](https://github.com/nikita-petko/next-pages-router-crawler/actions/workflows/build-docker.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

## Brief description

`next-pages-router-crawler` is a Go daemon that crawls a [Next.js](https://nextjs.org/) site built with the legacy **Pages Router**, discovers every static asset it serves (JS chunks, CSS, dynamically-imported bundles), and — when the underlying JavaScript still ships debug source maps — reconstructs the original, human-readable source tree on disk. It watches the site's Next.js **build ID** and only does this work when a new deployment is detected, then optionally fires off an alert (Discord, Email, or AWS SNS).

## Detailed description

Next.js Pages Router applications embed a build fingerprint (the *build ID*) and a manifest describing which JS/CSS chunks each page depends on. This tool leverages that public metadata to:

1. Walk a full site (every route in the build manifest) without needing a sitemap.
2. Collect every asset referenced by every page, including chunks that are only pulled in dynamically at runtime (`import()` / route-based code splitting), by statically scanning bundle text for webpack chunk references.
3. Look for `//# sourceMappingURL=` / `/*# sourceMappingURL= */` comments in the collected assets, fetch the referenced source maps, and unpack their `sources` / `sourcesContent` (or `sections`) into the original file layout under an output directory.
4. Avoid unnecessary network and disk I/O by caching HTTP responses on the file system, keyed by URL and validated by content hash against the response's `ETag`.
5. Detect when nothing has changed (same build ID as last run) and skip the run entirely — useful for scheduled CI jobs that only care about *new* deployments.
6. Notify a team through Discord, email, or SNS whenever a new build is found and processed.

This makes it useful for auditing what a Next.js production build is publicly exposing (accidentally shipped source maps, internal comments, unminified logic, etc.), for archiving/diffing a site's source over time, or simply for keeping an eye on when a target site ships a new build.

> This repository itself uses the tool in CI (see [`publish-output.yml`](.github/workflows/publish-output.yml)) to periodically crawl a fixed list of targets and publish whatever source it can recover to dedicated branches.

## Pipeline

Each run (a single "pulse", or one iteration of the daemon loop) executes the following pipeline, implemented across the packages in `src/`:

```
                       ┌────────────────────────┐
                       │ 1. Fetch initial page   │  html/, next/initial.go
                       │    HTML for --url       │
                       └───────────┬─────────────┘
                                   ▼
                       ┌────────────────────────┐
                       │ 2. Extract __NEXT_DATA__│  next/next_data.go
                       │    + head <script>/<link>
                       │    asset URLs           │
                       └───────────┬─────────────┘
                                   ▼
                       ┌────────────────────────┐
                       │ 3. Compare buildId to   │  cache/build_id.go
                       │    cached buildId       │
                       │    (skip run if same)   │
                       └───────────┬─────────────┘
                                   ▼
                       ┌────────────────────────┐
                       │ 4. Fetch & evaluate the │  next/build_manifest.go
                       │    Next.js build        │  (executes _buildManifest.js
                       │    manifest (JS→JSON)   │   in an embedded JS VM)
                       └───────────┬─────────────┘
                                   ▼
                       ┌────────────────────────┐
                       │ 5. Concurrently crawl   │  next/pages.go
                       │    every page in the    │
                       │    manifest for its own │
                       │    NextData + assets    │
                       └───────────┬─────────────┘
                                   ▼
                       ┌────────────────────────┐
                       │ 6. Fetch every unique   │  next/assets.go, cache/guard.go
                       │    asset, then          │
                       │    recursively resolve  │
                       │    dynamically-imported │
                       │    chunks               │
                       └───────────┬─────────────┘
                                   ▼
                       ┌────────────────────────┐
                       │ 7. Resolve & fetch      │  sourcemap/fetch.go
                       │    source maps          │  sourcemap/resolver.go
                       │    referenced by assets │
                       └───────────┬─────────────┘
                                   ▼
                       ┌────────────────────────┐
                       │ 8. Parse source maps &  │  sourcemap/parser.go
                       │    write recovered      │  sourcemap/writer.go
                       │    source files to      │
                       │    --output-path         │
                       └───────────┬─────────────┘
                                   ▼
                       ┌────────────────────────┐
                       │ 9. Alert (Discord/      │  alerting/
                       │    SendGrid/SNS) that a │
                       │    new build was found  │
                       └───────────┬─────────────┘
                                   ▼
                    ┌────────────────────────────────┐
                    │ 10. Exit (--pulse) or sleep for │  daemon/
                    │     --interval and repeat        │
                    └────────────────────────────────┘
```

If step 3 finds the build ID hasn't changed since the last successful run, the pipeline stops early (exit code `2` in `--pulse` mode) without doing any further network calls.

## Features

### Application features

- **Build-ID aware crawling** — persists the last-seen Next.js build ID per target URL and skips re-crawling a site until a new build is published.
- **Full page discovery** — reads the Next.js build manifest directly (via an embedded JS runtime, [`goja`](https://github.com/dop251/goja)) to enumerate every route, with no need for a sitemap or link-following.
- **Dynamic chunk resolution** — recursively scans fetched bundles for `static/chunks/...` references to pick up code-split/dynamically-imported chunks that aren't referenced from the initial HTML.
- **Source map recovery** — resolves `sourceMappingURL` comments, downloads the corresponding `.map` files, and reconstructs original source trees from either `sources`/`sourcesContent` or multi-section source maps, stripping `webpack://` / `turbopack://` prefixes.
- **File-system backed caching** — every HTTP response is cached to disk (not memory) so large sites don't blow up RAM, and is re-validated against the response `ETag` using an MD5 content hash instead of re-downloading unchanged files.
- **Concurrent fetching** — pages and assets are fetched in parallel using goroutines with mutex-guarded aggregation of results/errors.
- **Retrying HTTP client** — all outbound requests go through a retryable HTTP client ([`go-retryablehttp`](https://github.com/hashicorp/go-retryablehttp)) with request/error logging routed through `glog`.
- **Multi-channel alerting** — can notify on every new-build detection via:
  - a **Discord** webhook (rich embed, optional role ping),
  - **SendGrid** email to a configured mailing list,
  - an **AWS SNS** topic (via IAM profile or access-key/secret credentials).
- **Two run modes** — a long-running **daemon** that re-crawls on a configurable `--interval`, or a single-shot **`--pulse`** mode (ideal for CI/cron), which exits with code `2` when there's nothing new to do.
- **Configurable everything** — every setting is available as both a CLI flag and an environment variable.
- **Graceful shutdown** — traps `SIGINT`/`SIGTERM`/`SIGABRT`, flushes logs, and releases the cache lock cleanly.
- **Structured logging** — built on [`glog`](https://github.com/golang/glog) with configurable verbosity (`-v`), log-to-file, and log-to-stderr behavior.

### Repository features

- **Vendored Go modules** (`go mod vendor`) for fully reproducible, network-independent builds.
- **Cross-platform Makefile** — debug and release (symbol-stripped) build targets for `linux`/`darwin`/`windows` across `x86`, `x64`, `arm`, and `arm64`, plus convenience `*-all` targets that build every architecture in one shot.
- **Single-stage Dockerfile** producing a minimal image containing only the compiled release binary (source is removed post-build).
- **CI (GitHub Actions)**:
  - [`build.yml`](.github/workflows/build.yml) — lints (`go vet`), builds a release binary, uploads it as an artifact, and cuts a GitHub Release on every push to `master`.
  - [`build-docker.yml`](.github/workflows/build-docker.yml) — builds and pushes a Docker image (manually dispatchable with a custom registry/image/company/project name).
  - [`publish-output.yml`](.github/workflows/publish-output.yml) — manually-triggered workflow that runs the crawler in `--pulse` mode against a fixed matrix of targets and commits any recovered source to a per-target branch in this repository, reusing cached build-ID state between runs.
- **CodeQL configuration** scoped to `src/` for static analysis.
- **CODEOWNERS** for review routing.
- **Apache License 2.0**.

## Requirements

- [Go 1.25+](https://go.dev/dl/) (see `src/go.mod`)
- [GNU Make](https://www.gnu.org/software/make/)
- Docker (optional, for containerized builds/runs)

## Running

This repository provides [releases](https://github.vmminfra.dev/mfdlabs/next-pages-router-crawler/releases) and [Docker images](https://hub.docker.com/repository/docker/mfdlabs/next-pages-router-crawler) — you don't need to build from source to use the tool.

## Building

1. Clone the repository via `git`:

    ```sh
    git clone git@github.com:nikita-petko/next-pages-router-crawler.git
    cd next-pages-router-crawler
    ```

2. Build via [make](https://www.gnu.org/software/make/):

    ```sh
    make build-debug WITH_STDERR=1
    ```

    Other useful targets:

    | Target | Description |
    | --- | --- |
    | `build-debug` | Debug build for the host OS/arch |
    | `build-release` | Release build (stripped symbols) for the host OS/arch |
    | `build-debug-<arch>` / `build-release-<arch>` | Build for a specific `x86`, `x64`, `arm`, or `arm64` target |
    | `build-debug-all` / `build-release-all` | Build every supported architecture |
    | `build-docker` | Build (and, in CI, push) a Docker image |
    | `test` | `go fmt`, `go vet`, and `go test` across the module |
    | `vendor` | Re-run `go mod tidy && go mod vendor` |

    Built binaries are placed under `bin/<debug|release>/<os>/<arch>/`.

### Building with Docker

```sh
make build-docker IMAGE_NAME=mfdlabs/next-pages-router-crawler PROJECT_NAME=next-pages-router-crawler
```

or directly:

```sh
docker build -t next-pages-router-crawler -f Dockerfile .
docker run --rm next-pages-router-crawler --url https://example.com --pulse
```

## Usage

`cd src && go run main.go --help` (use the built binary found in the `bin` directory if you downloaded a prebuilt release or built it yourself).

```txt
Usage: next-pages-router-crawler
Build Mode: 
Commit:  
        [-h|--help] [--interval[=5m]] [--pulse]
        [--url[=]]
        [--sendgrid-api-key[=]] [--sendgrid-from[=]] [--sendgrid-from-email[=]] [--sendgrid-mailing-list[=]]
        [--sns-topic-arn[=]] [--aws-credentials-from-profile[=false]]
        [--discord-webhook-uri[=]] [--discord-alert-role-id[=0]]

  -alsologtostderr
        log to standard error as well as files
  -aws-credentials-from-profile
        Is the AWS SNS Credentials coming from a profile file? If not use enviornment variables. (environment variable: AWS_CREDENTIALS_FROM_PROFILE)
  -cache-path string
        The path to the cache directory. Defaults to .cache. This is required. (environment variable: CACHE_PATH) (default ".cache")
  -clear-cache
        Clear the cache before starting the daemon. (environment variable: CLEAR_CACHE)
  -clear-output
        Clear the output before starting the daemon. (environment variable: CLEAR_OUTPUT)
  -discord-alert-role-id uint
        The ID of the role that should be pinged when an alert is sent. (environment variable: DISCORD_ALERT_ROLE_ID)
  -discord-webhook-uri string
        The url that was generated when creating a Discord WebHook. (environment variable: DISCORD_WEBHOOK_URI)
  -help
        Print usage.
  -interval duration
        Interval to wait between each request. (environment variable: INTERVAL) (default 5m0s)
  -log_backtrace_at value
        when logging hits line file:N, emit a stack trace
  -log_dir string
        If non-empty, write log files in this directory
  -log_link string
        If non-empty, add symbolic links in this directory to the log files
  -logbuflevel int
        Buffer log messages logged at this level or lower (-1 means don't buffer; 0 means buffer INFO only; ...). Has limited applicability on non-prod platforms.
  -logtostderr
        log to standard error instead of files
  -output-path string
        The path to the output directory. Defaults to .output. This is required. (environment variable: OUTPUT_PATH) (default ".output")
  -pulse
        Run once and exit.
  -sendgrid-api-key string
        The SendGrid API key. This is optional. (environment variable: SENDGRID_API_KEY)
  -sendgrid-from string
        The name to use as the sender. This is required if the API Key is specified. (environment variable: SENDGRID_FROM)
  -sendgrid-from-email string
        The email address to use as the sender. This is required if the API Key is specified. (environment variable: SENDGRID_FROM_EMAIL)
  -sendgrid-mailing-list string
        The mailing list to send the emails to. This is required if the API Key is specified. (environment variable: SENDGRID_MAILING_LIST)
  -sns-topic-arn string
        The ARN to the topic created in AWS SNS. This is optional. Needs AWS_ACCESS_KEY and AWS_SECRET_ACCESS_KEY. (environment variable: SNS_TOPIC_ARN)
  -stderrthreshold value
        logs at or above this threshold go to stderr (default 2)
  -url string
        The url to use to download the initial HTML document to determine the Next.js build manifest location. (environment variable: URL)
  -v value
        log level for V logs
  -vmodule value
        comma-separated list of pattern=N settings for file-filtered logging
```

> **Note:** the SendGrid flags' help text advertises `SENDGRID_*` environment variables, but the current implementation (`src/flags/env.go`) actually reads `SEND_GRID_API_KEY`, `SEND_GRID_FROM`, `SEND_GRID_FROM_EMAIL`, and `SEND_GRID_MAILING_LIST` (with an underscore between "SEND" and "GRID"). Use the CLI flags directly if in doubt.

### Environment variables

Every flag above has a corresponding environment variable that takes precedence when the flag is left at its default. `AWS_ACCESS_KEY` and `AWS_SECRET_ACCESS_KEY` are also read directly by the AWS SDK when `--aws-credentials-from-profile` is not set and an SNS topic is configured.

### Example: one-shot run with Discord alerting

```sh
next-pages-router-crawler \
  --url "https://example.com" \
  --pulse \
  --output-path .output \
  --cache-path .cache \
  --discord-webhook-uri "https://discord.com/api/webhooks/..." \
  --discord-alert-role-id 123456789012345678
```

### Output & cache layout

- `--cache-path/<host>/<path>.cache` — raw cached HTTP response bodies, validated against the response `ETag` via an MD5 hash.
- `--cache-path/<host>/<path>/.build` — the last-seen Next.js build ID for that target.
- `--cache-path/cache.lock` — an exclusive lock file preventing concurrent crawler instances from corrupting the cache.
- `--output-path/<host>/<original module path>` — recovered original source files, with `webpack://`/`turbopack://` prefixes stripped from their paths.

## Project layout

| Package | Responsibility |
| --- | --- |
| `flags` | CLI flag & environment variable definitions/parsing |
| `http` | Retryable HTTP client shared across the app |
| `cache` | File-system backed, hash-validated HTTP response cache, build-ID tracking, and the cache directory lock file |
| `html` | Minimal HTML parsing helpers (head/body/element lookup) built on `golang.org/x/net/html` |
| `next` | Next.js–specific logic: `__NEXT_DATA__` extraction, build manifest evaluation, page/asset crawling |
| `sourcemap` | Source map discovery, fetching, parsing, and writing recovered sources to disk |
| `url` | Base URL / asset-prefix resolution helpers |
| `alerting` | Unified alert dispatch across Discord, SendGrid, and AWS SNS |
| `daemon` | The main work loop / single-pulse runner and OS signal handling |

## License

```txt
Copyright 2023 Nikita Petko <petko@vmminfra.net>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
