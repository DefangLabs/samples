# Scikit RAG + OpenAI

This sample demonstrates how to deploy a Flask-based Retrieval-Augmented Generation (RAG) chatbot using OpenAI's GPT model. The chatbot retrieves relevant documents from a knowledge base using scikit-learn and Sentence Transformers and then generates responses using OpenAI's GPT model. There is an LRU caching scheme of 128 queries.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticated with your AWS account
3. (Optional - for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Deploying

1. Open the terminal and type `defang login`
2. Type `defang compose up` in the CLI.
3. Your app will be running within a few minutes.

## Local Development

1. Clone the repository.
2. Create a `.env` file in the root directory and set your OpenAI API key or add the OPENAI_API_KEY into your .zshrc or .bashrc file:
3. Run the command `docker compose up --build` to spin up a docker container for this RAG chatbot

## Configuration

- The knowledge base is acquired via parsing an sitemap located at "https://docs.defang.io/sitemap.xml".
- The file `scrape_sitemap.py` parses every webpage as specified into paragraphs and writes to `knowledge_base.json` for the RAG retrieval.
- To obtain your own knowledge base, either use another sitemap or write your own parsing scheme to parse into knowledge_base.json.
- A least recently used (LRU) caching scheme is also in place as can be seen in `rag_system.py`. This caches common queries to have a faster response time. Feel free to adjust as needed.

---

Title: Scikit RAG + OpenAI

Short Description: A short hello world application demonstrating how to deploy a Flask-based Retrieval-Augmented Generation (RAG) chatbot using OpenAI's GPT model onto Defang.

Tags: Flask, Scikit, Python, RAG, OpenAI, GPT, Machine Learning

Languages: python
