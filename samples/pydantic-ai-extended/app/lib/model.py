"""
Model resolution for Defang's OpenAI-compatible `provider: model` services.

The application never talks to Bedrock or Vertex directly. Instead, Compose
defines dedicated `chat` and `embedding` services, and Defang injects:
  - CHAT_URL / CHAT_MODEL
  - EMBEDDING_URL / EMBEDDING_MODEL

Those endpoints stay stable across local Docker Model Runner, Playground,
AWS, and GCP. The app code only sees OpenAI-compatible URLs plus model IDs.
"""

from __future__ import annotations

import os

from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider


def _require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"{name} is not configured")
    return value


def has_chat_access() -> bool:
    return bool(os.environ.get("CHAT_URL") and os.environ.get("CHAT_MODEL"))


def has_embedding_access() -> bool:
    return bool(os.environ.get("EMBEDDING_URL") and os.environ.get("EMBEDDING_MODEL"))


def get_chat_model() -> OpenAIChatModel:
    return OpenAIChatModel(
        _require_env("CHAT_MODEL"),
        provider=OpenAIProvider(
            base_url=_require_env("CHAT_URL"),
            api_key=os.environ.get("OPENAI_API_KEY", "defang"),
        ),
    )


def get_embedding_config() -> tuple[str, str, str]:
    """Returns (base_url, model_id, api_key) for the embedding service."""
    return (
        _require_env("EMBEDDING_URL"),
        _require_env("EMBEDDING_MODEL"),
        os.environ.get("OPENAI_API_KEY", "defang"),
    )
