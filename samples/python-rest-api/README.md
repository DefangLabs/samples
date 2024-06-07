# Fetch and Return JSON

This Flask application fetches average interest rates from the Fiscal Data Treasury API. It provides endpoints to check the status of the API and to retrieve the latest average interest rates. Note that alognside your .py file, include a requirements.txt so that the Dockerfile can install the necessary packages with pip.

## Features

Endpoint to check API status.
Endpoint to fetch average interest rates from the Fiscal Data Treasury API.

## Essential Setup Files

1. A [Dockerfile](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/).
2. A [compose file](https://docs.defang.io/docs/concepts/compose) to define and run multi-container Docker applications (this is how Defang identifies services to be deployed). This is optional

## Prerequisite

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc), make sure you have properly [authenticated your AWS account (optional)](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)

## A Step-by-Step Guide

1. Open the terminal and type `defang login`
2. Type `defang compose up` in the CLI
3. Your app should be up and running with Defang in minutes!

---

Title: Python Fetch and Return JSON

Short Description: A Flask application that fetches average interest rates from the Fiscal Data Treasury API

Tags: flask, rest, python

Languages: python
