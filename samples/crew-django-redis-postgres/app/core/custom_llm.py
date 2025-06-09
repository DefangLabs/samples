from typing import Any, Dict, List, Optional, Union
from crewai.llms.base_llm import BaseLLM
import os
from .ai_clients import get_llm_client

LLM_MODEL = os.getenv("LLM_MODEL")


class DockerRunnerLLM(BaseLLM):
    """
    Custom LLM that uses the OpenAI-compatible API.
    Implements CrewAI's BaseLLM interface. We create this because the 
    Docker Model Runner is not yet supported by CrewAI, because LiteLLM doesn't
    recognize the format in which the Docker Model Runner names the models.
    """
    def __init__(self, model: str = LLM_MODEL):
        super().__init__(model=model)
        if not model or not isinstance(model, str):
            raise ValueError("Invalid model: must be a non-empty string")

        self.stop = []  # Customize stop words if needed
        # OpenAI SDK client with custom url
        self.client = get_llm_client()

    def call(
        self,
        messages: Union[str, List[Dict[str, str]]],
        tools: Optional[List[dict]] = None,
        callbacks: Optional[List[Any]] = None,
        available_functions: Optional[Dict[str, Any]] = None,
    ) -> Union[str, Any]:
        """Call the LLM with the given messages (CrewAI interface), using OpenAI SDK."""
        # Convert string message to proper format if needed
        if isinstance(messages, str):
            messages = [{"role": "user", "content": messages}]
        try:
            kwargs = {
                "model": self.model,
                "messages": messages,
            }

            if tools is not None:
                kwargs["tools"] = tools
            if self.stop:
                kwargs["stop"] = self.stop
            # The OpenAI SDK will use the custom url and api_key
            response = self.client.chat.completions.create(**kwargs)
            content = response.choices[0].message.content
            return content
        except Exception as e:
            raise RuntimeError(f"LLM call failed: {str(e)}")

    def supports_function_calling(self) -> bool:
        """Return True if the LLM supports function calling."""
        return False  # Set to True if your model supports function calling

    def supports_stop_words(self) -> bool:
        """Return True if the LLM supports stop words."""
        return True

    def get_context_window_size(self) -> int:
        """Return the context window size of your LLM."""
        return 4096  # Adjust according to your model's capabilities
