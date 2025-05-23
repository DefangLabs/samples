from celery import shared_task
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import time
import crewai

from .custom_llm import DockerRunnerLLM


def crewai_hello(text: str):
    llm = DockerRunnerLLM()

    # Define the agent
    echo_agent = crewai.Agent(
        role="Summarizer",
        goal="Summarize the input I receive.",
        backstory="An agent designed to summarize any input it receives.",
        llm=llm,
    )

    # Define the task
    echo_task = crewai.Task(
        description=f"Summarize the following text: '{text}'",
        agent=echo_agent,
        expected_output=f"The summary of '{text}'.",
    )

    # Create the crew with the agent and task
    crew = crewai.Crew(
        agents=[echo_agent],
        tasks=[echo_task],
    )

    # Execute the task
    result = crew.kickoff()
    return result

@shared_task
def crewai_hello_task(text: str, group_name: str):
    channel_layer = get_channel_layer()
    # Simulate streaming by sending two messages
    async_to_sync(channel_layer.group_send)(group_name, {"type": "stream_message", "message": f"Started processing: {text}"})
    result = crewai_hello(text)
    async_to_sync(channel_layer.group_send)(group_name, {"type": "stream_message", "message": result.raw})
