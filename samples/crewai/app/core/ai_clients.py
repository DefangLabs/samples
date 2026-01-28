import os

from openai import OpenAI


def get_llm_client():
    url = os.getenv("CHAT_URL")
    model = os.getenv("CHAT_MODEL")

    # we check for url and model because these come together
    # with the docker runner
    if not url or not model:
        raise ValueError("CHAT_URL and CHAT_MODEL must be set")

    client = OpenAI(base_url=url)
    return client

def get_embedding_client():
    url = os.getenv("EMBEDDING_URL")
    model = os.getenv("EMBEDDING_MODEL")

    # we check for url and model because these come together
    # with the docker runner
    if not url or not model:
        raise ValueError("EMBEDDING_URL and EMBEDDING_MODEL must be set")
    client = OpenAI(base_url=url)
    return client
