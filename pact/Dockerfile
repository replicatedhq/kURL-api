FROM golang:1.19 as builder-go

ENV PROJECT_PATH=/go/src/github.com/replicatedhq/kurl-api
WORKDIR $PROJECT_PATH

COPY go.mod go.sum $PROJECT_PATH/
RUN go mod download

COPY Makefile $PROJECT_PATH/
COPY cmd $PROJECT_PATH/cmd
RUN make build/bin/server


FROM node:14 as builder-node

WORKDIR /src

COPY Makefile .
COPY package.json .
COPY package-lock.json .
RUN make deps

ADD . .
RUN make build
RUN chmod +x build/bin/kurl


FROM node:14

RUN DEBIAN_FRONTEND=noninteractive apt-get update -qq \
  && apt-get install --no-install-recommends -y \
    ca-certificates \
    netcat \
  && rm -rf /var/lib/apt/lists/* \
  && update-ca-certificates

ARG version=unknown
ENV VERSION=$version

WORKDIR /src

COPY --from=builder-node /src/node_modules node_modules
COPY --from=builder-node /src/build build
COPY --from=builder-go /go/src/github.com/replicatedhq/kurl-api/build/bin/server /bin/server
COPY pact/wait-for .

EXPOSE 3000
CMD ["node", "--no-deprecation", "build/bin/kurl", "serve"]
