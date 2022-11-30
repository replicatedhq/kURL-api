SHELL := /bin/bash
PROJECT_NAME ?= kurl
BUILDFLAGS = -tags "containers_image_openpgp containers_image_ostree_stub exclude_graphdriver_btrfs exclude_graphdriver_devicemapper"

.PHONY: deps
deps:
	npm install

depcheck:
	# npm install depcheck -g
	depcheck . --specials=bin,mocha,eslint

.PHONY: test
test: deps
	npm run test
	# missing api-tests, pact tests

.PHONY: lint
lint:
	npx eslint . --ext .js,.jsx,.ts,.tsx

.PHONY: build
build:
	`npm bin`/tsc --project .
	mkdir -p build/bin
	cp newrelic.js build/bin/newrelic.js
	cp build/kurl.js build/bin/kurl
	chmod +x build/bin/kurl

.PHONY: run
run:
	build/bin/kurl serve

go-test: cmd/server/main.go go.mod go.sum
	go test ${BUILDFLAGS} ./cmd/...

build/bin/server: cmd/server/main.go go.mod go.sum
	mkdir -p build/bin
	go build -o build/bin/server $(BUILDFLAGS) cmd/server/main.go

.PHONY: run-debug
run-debug:
	node --inspect=0.0.0.0:9229 build/bin/kurl serve

.PHONY: archive-modules
archive-modules:
	tar cfz node_modules.tar.gz node_modules/

.PHONY: build-staging
build-staging: REGISTRY = 923411875752.dkr.ecr.us-east-1.amazonaws.com
build-staging: build_and_push

.PHONY: build-production
build-production: REGISTRY = 799720048698.dkr.ecr.us-east-1.amazonaws.com
build-production: build_and_push

build_and_push:
	docker build -f deploy/Dockerfile -t ${PROJECT_NAME}:$${CIRCLE_SHA1:0:7} .
	docker tag ${PROJECT_NAME}:$${CIRCLE_SHA1:0:7} $(REGISTRY)/${PROJECT_NAME}:$${CIRCLE_SHA1:0:7}
	docker push $(REGISTRY)/${PROJECT_NAME}:$${CIRCLE_SHA1:0:7}

.PHONY: fixtures
fixtures:
	docker build -t repldev/kurl-fixtures:local -f ./migrations/fixtures/Dockerfile ./migrations
