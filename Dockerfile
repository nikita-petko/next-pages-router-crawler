FROM golang:latest

WORKDIR /all

RUN apt install -y make

COPY . .
RUN make build-release-x64 WITH_STDERR=true PROJECT_NAME=next-pages-router-crawler

RUN rm -rf /all/src/

ENTRYPOINT ["/all/bin/release/linux/x64/next-pages-router-crawler"]
