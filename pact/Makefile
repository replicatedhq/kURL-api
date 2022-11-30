PACT_BROKER_PUBLISH_VERIFICATION_RESULTS ?= false
PACT_BROKER_BASE_URL ?= https://replicated.pactflow.io
PACT_BROKER_TOKEN ?= W2y60iAYJbPuWSL_wsObzw # read-only token, safe

export PACT_BROKER_BASE_URL
export PACT_BROKER_PUBLISH_VERIFICATION_RESULTS
export PACT_BROKER_TOKEN

.PHONY: provider-verify
provider-verify: verify-setup verify verify-teardown

.PHONY: verify-setup
verify-setup:
	docker compose down --remove-orphans
	docker compose up --build -d

.PHONY: verify
verify:
	./wait-for http://localhost:3000/healthz -t 60 -- pact-provider-verifier \
		${PACT_URL} \
		--provider-base-url="http://localhost:3000" \
		--provider=kurl-api \
		--provider-app-version=${GIT_COMMIT} \
		$$([ -n "${PACT_URL}" ] || echo "--consumer-version-selector="$${PACT_CONSUMER_VERSION_SELECTOR:-'{"deployedOrReleased":true,"environment":"staging"}'}) \
		$$([ "${PACT_BROKER_PUBLISH_VERIFICATION_RESULTS}" = "true" ] && echo "--publish-verification-results" ) 

.PHONY: verify-teardown
verify-teardown:
	docker compose down --remove-orphans

tttt:
	echo ${PACT_BROKER_TOKEN}