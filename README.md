# kURL API

This directory holds a web server with an API for creating and serving custom kURL installers.

This is a hosted service that is not deployed to the end customer environment.

## Running Locally

*NOTE: This project currently depends on an external MySQL database*

1. Run `okteto pipeline deploy` from project root

## Releasing

Staging will be released on merge to main.
Production requires [approval](https://docs.github.com/en/actions/managing-workflow-runs/reviewing-deployments).
