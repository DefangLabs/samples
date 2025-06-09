from celery import shared_task
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import crewai
import openai
import os

from pgvector.django import CosineDistance

from .custom_llm import DockerRunnerLLM
from .ai_clients import get_embedding_client


def crewai_summary(text: str):
    from .models import Summary
    embedding_client = get_embedding_client()

    embedding = embedding_client.embeddings.create(
        model=os.getenv("EMBEDDING_MODEL"),
        input=text,
    )

    summaries = Summary.objects.annotate(
        distance=CosineDistance('embedding', embedding.data[0].embedding)
    ).filter(distance__lt=0.2).order_by('distance')

    if summaries.exists():
        summary = summaries.first()
        return summary.text, "Found semantically very similar summary."
    
    llm = DockerRunnerLLM()

    # Define the agent
    summary_agent = crewai.Agent(
        role="Summarizer",
        goal="Summarize the input I receive.",
        backstory="You are an expert at summarizing text in a single sentence. You have an excellent reputation for your ability to do so and never go overboard.",
        llm=llm,
    )

    # Define the task
    summary_task = crewai.Task(
        description=f"Summarize the following text: '{text}'",
        agent=summary_agent,
        expected_output=f"The summary of '{text}' in one sentence.",
    )

    # Create the crew with the agent and task
    crew = crewai.Crew(
        agents=[summary_agent],
        tasks=[summary_task],
    )

    # Execute the task
    result = crew.kickoff()
    summary = result.raw

    summary_embedding = embedding_client.embeddings.create(
        model=os.getenv("EMBEDDING_MODEL"),
        input=summary,
    ).data[0].embedding

    try:
        Summary.objects.create(
            text=summary,
            embedding=summary_embedding,
        )
    except Exception as e:
        print(e)

    return summary, None

@shared_task
def crewai_summary_task(text: str, group_name: str):
    channel_layer = get_channel_layer()
    # Simulate streaming by sending two messages
    async_to_sync(channel_layer.group_send)(group_name, {"type": "stream_message", "message": f"Started processing: {text[:10]}...", "status": "processing"})
    result, message = crewai_summary(text)
    if message:
        async_to_sync(channel_layer.group_send)(group_name, {"type": "stream_message", "message": message, "status": "info"})
    async_to_sync(channel_layer.group_send)(group_name, {"type": "stream_message", "message": result, "status": "done"})
