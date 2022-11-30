# kURL API

This directory holds a web server with an API for creating and serving custom kURL installers.

This is a hosted service that is not deployed to the end customer environment.

## Running Locally

1. Run `okteto pipeline deploy` from the project root.

## Pact provider verification

To run Pact provider verification locally, run `make -C pact provider-verify`. The `PACT_BROKER_TOKEN` environment variable must be set.

By default, the verification runs against all consumers in the staging environment. To change this behavior, set the `PACT_CONSUMER_VERSION_SELECTOR` variable as desired ([docs](https://docs.pact.io/pact_broker/advanced_topics/consumer_version_selectors)). Altenatively, set the `PACT_URL` environment variable to the URLs or paths of specific contracts.

## Releasing

Staging will be released on merge to main.
Production requires [approval](https://docs.github.com/en/actions/managing-workflow-runs/reviewing-deployments).
