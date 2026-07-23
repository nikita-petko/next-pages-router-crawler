# next-pages-router-crawler

Next.js pages router crawler is a tool for crawling Next.js applications that use the pages router. It can be used to generate a list of all the pages in a Next.js application, as well as to check for broken links and other issues.

## Running

This repository provides [releases](https://github.vmminfra.dev/mfdlabs/next-pages-router-crawler/releases) and [docker images](https://hub.docker.com/repository/docker/mfdlabs/next-pages-router-crawler)

## Building

Ensure you have [Go 1.20.3+](https://go.dev/dl/)

1. Clone the repository via `git`:

    ```txt
    git clone git@github.com:nikita-petko/next-pages-router-crawler.git
    cd next-pages-router-crawler
    ```

2. Build via [make](https://www.gnu.org/software/make/)

    ```txt
    make build-debug WITH_STDERR=1
    ```

## Usage

`cd src && go run main.go --help` (use the build binary found in the bin directory if you downloaded a prebuilt or built it yourself)

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
