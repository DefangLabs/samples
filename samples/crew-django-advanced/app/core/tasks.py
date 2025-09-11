"""Celery tasks showcasing a multi-agent CrewAI workflow.

This module implements a branching workflow using several CrewAI agents:
classifier, researcher, writer and translator.  Depending on the user's
request the system either performs a simple summarisation, conducts
additional research before writing a response, or translates the input
into another language.

The goal is to demonstrate how to orchestrate multiple LLMs of different
sizes within a single Celery task while streaming intermediate results
back to the client via Django Channels.
"""

from celery import shared_task
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import crewai
import os
from typing import Tuple

from .custom_llm import DockerRunnerLLM
from .ai_clients import get_embedding_client


# ---------------------------------------------------------------------------
# Agent helpers
# ---------------------------------------------------------------------------


def _run_classification(user_text: str) -> str:
    """Classify the user request using a small LLM.

    Returns one of ``summary``, ``research`` or ``translate``.
    """
    llm = DockerRunnerLLM(env_prefix="SMALL_LLM")
    agent = crewai.Agent(
        role="Classifier",
        goal="Decide whether the user wants a summary, research or translation",
        backstory="Quickly label the request. Respond with only one word.",
        llm=llm,
    )
    task = crewai.Task(
        description=(
            "Classify the following text into one of the words 'summary',"
            " 'research' or 'translate' and respond with only that word: "
            f"'{user_text}'"
        ),
        agent=agent,
        expected_output="summary | research | translate",
    )
    crew = crewai.Crew(agents=[agent], tasks=[task])
    return crew.kickoff().raw.strip().lower()


def _run_summary(text: str) -> str:
    """Generate a concise summary using the large LLM."""
    llm = DockerRunnerLLM(env_prefix="LARGE_LLM")
    agent = crewai.Agent(
        role="Summarizer",
        goal="Summarise user provided text in one sentence",
        backstory="Expert at concise communication.",
        llm=llm,
    )
    task = crewai.Task(
        description=f"Summarise the following text: '{text}'",
        agent=agent,
        expected_output="One sentence summary",
    )
    crew = crewai.Crew(agents=[agent], tasks=[task])
    return crew.kickoff().raw


def _run_research_and_write(topic: str) -> str:
    """Research a topic then write a short explanation."""
    research_llm = DockerRunnerLLM(env_prefix="MEDIUM_LLM")
    writer_llm = DockerRunnerLLM(env_prefix="LARGE_LLM")
    research_agent = crewai.Agent(
        role="Researcher",
        goal="Gather key facts and references about a topic",
        backstory="Uses search tools to collect information.",
        llm=research_llm,
    )
    writer_agent = crewai.Agent(
        role="Writer",
        goal="Compose a clear answer based on collected facts",
        backstory="Excellent at explaining complex topics to a general audience.",
        llm=writer_llm,
    )
    research_task = crewai.Task(
        description=f"Research the topic: '{topic}'",
        agent=research_agent,
        expected_output="bullet list of key facts",
    )
    write_task = crewai.Task(
        description="Write a concise paragraph using the research",
        agent=writer_agent,
        expected_output="brief paragraph",
    )
    crew = crewai.Crew(
        agents=[research_agent, writer_agent], tasks=[research_task, write_task]
    )
    return crew.kickoff().raw


def _run_translation(text: str) -> str:
    """Translate text into the target language using the medium LLM."""
    llm = DockerRunnerLLM(env_prefix="MEDIUM_LLM")
    agent = crewai.Agent(
        role="Translator",
        goal="Translate English text into Spanish",
        backstory="Fluent in many languages and keeps meaning intact.",
        llm=llm,
    )
    task = crewai.Task(
        description=f"Translate the following text into Spanish: '{text}'",
        agent=agent,
        expected_output="Spanish translation",
    )
    crew = crewai.Crew(agents=[agent], tasks=[task])
    return crew.kickoff().raw


# ---------------------------------------------------------------------------
# Celery entry point
# ---------------------------------------------------------------------------


@shared_task
def crewai_advanced_task(text: str, group_name: str) -> None:
    """Entry point for the advanced workflow.

    Streams intermediate status messages back to ``group_name`` so the client
    can display progress updates in real time.
    """
    channel_layer = get_channel_layer()

    def send(status: str, message: str) -> None:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {"type": "stream_message", "status": status, "message": message},
        )

    send("processing", f"Classifying request: {text[:20]}...")
    decision = _run_classification(text)
    send("info", f"Classifier decision: {decision}")

    if decision == "summary":
        result = _run_summary(text)
    elif decision == "research":
        result = _run_research_and_write(text)
    else:
        result = _run_translation(text)

    send("done", result)

    # Optionally store summary embeddings for similarity search
    if decision == "summary":
        embedding_client = get_embedding_client()
        embedding = (
            embedding_client.embeddings.create(
                model=os.getenv("EMBEDDING_MODEL"), input=result
            )
            .data[0]
            .embedding
        )
        from .models import Summary

        try:
            Summary.objects.create(text=result, embedding=embedding)
        except Exception as exc:  # pragma: no cover - best effort
            print(exc)
