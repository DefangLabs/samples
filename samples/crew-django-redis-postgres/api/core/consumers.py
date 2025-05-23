import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync
from django.conf import settings
from .tasks import crewai_hello_task

import uuid

class EchoConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Generate a safe, unique group name for this connection
        self.group_name = f"echo_{uuid.uuid4().hex}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)
        text = data.get("text", "")
        # Send to celery task (fire and forget)
        crewai_hello_task.delay(text, self.group_name)
        await self.send(text_data=json.dumps({"status": "processing", "text": text}))

    async def stream_message(self, event):
        # Called by celery worker through channel layer
        message = event["message"]
        await self.send(text_data=json.dumps({"result": message}))
