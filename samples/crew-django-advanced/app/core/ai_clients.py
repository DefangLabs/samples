"""Utility helpers for accessing OpenAI-compatible endpoints.

This module provides thin wrappers around the ``openai`` SDK so that the rest
of the codebase does not need to repeatedly parse environment variables.  The
existing sample supported a single LLM endpoint via ``LLM_URL`` and
``LLM_MODEL``.  For the advanced sample we support multiple LLM sizes (small,
medium and large) by allowing a configurable environment variable prefix.

Example::

    get_llm_client()                    # uses LLM_URL / LLM_MODEL
    get_llm_client(prefix="SMALL_LLM")  # uses SMALL_LLM_URL / SMALL_LLM_MODEL
"""

from openai import OpenAI
import os


def get_llm_client(prefix: str = "LLM") -> OpenAI:
    """Return an OpenAI client for the given prefix.

    Parameters
    ----------
    prefix: str
        Environment variable prefix. For example ``SMALL_LLM`` will read
        ``SMALL_LLM_URL`` and ``SMALL_LLM_MODEL``.
    """

    url = os.getenv(f"{prefix}_URL")
    model = os.getenv(f"{prefix}_MODEL")

    # These come as a pair from the Docker Model Runner configuration.
    if not url or not model:
        raise ValueError(f"{prefix}_URL and {prefix}_MODEL must be set")

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
