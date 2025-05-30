from openai import OpenAI
import os

def get_llm_client():
    api_key = ""
    url = os.getenv("LLM_URL")
    model = os.getenv("LLM_MODEL")

    # we check for url and model because these come together
    # with the docker runner
    if not url or not model:
        raise ValueError("LLM_URL and LLM_MODEL must be set")

    client = OpenAI(base_url=url, api_key=api_key)
    return client

def get_embedding_client():
    api_key = ""
    url = os.getenv("EMBEDDING_URL")
    model = os.getenv("EMBEDDING_MODEL")

    # we check for url and model because these come together
    # with the docker runner
    if not url or not model:
        raise ValueError("EMBEDDING_URL and EMBEDDING_MODEL must be set")
    client = OpenAI(base_url=url, api_key=api_key)
    return client
    