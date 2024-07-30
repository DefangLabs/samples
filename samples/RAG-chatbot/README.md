# Mistral & vLLM

This guide demonstrates how to deploy a Retrieval-Augmented Generation (RAG) chatbot using Sentence-BERT (SBERT) and scikit-learn on to Defang.

## Prerequisites

- Pre-parsed data into sentences.

## Steps

1. **Parsing your knowledge base**

   First, find a way to parse your information into sentences, for the correct format, please refer to `rag_system.py` for guidance.

2. **Launch with Defang Compose**

   Run the following command to start the services:

   ```bash
   defang compose up
   ```

   > **Changing the content:** The content for the bot is set in `rag_system.py`. You can edit the content there to change the behavior and information processed. Currently, the content is based off of the `docs.md` markdown file, which gives information about Defang.

---

Title: Scikit & SBERT & RAG

Short Description: A RAG chatbot using Scikit and SBERT trained on the defang documentation

Tags: RAG, Chatbot, SBERT, scikit-learn, Flask, AI, Docker, Python

Languages: python
