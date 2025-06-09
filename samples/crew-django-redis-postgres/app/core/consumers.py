import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync
from django.conf import settings
from .tasks import crewai_summary_task

import uuid

class SummaryConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Generate a safe, unique group name for this connection
        self.group_name = f"summary_{uuid.uuid4().hex}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)
        text = data.get("text", "")
        # Send to celery task (fire and forget)
        crewai_summary_task.delay(text, self.group_name)
        await self.send(text_data=json.dumps({"status": "starting", "message": f"Received: {text[:10]}..."}))

    async def stream_message(self, event):
        # Called by celery worker through channel layer
        await self.send(text_data=json.dumps({"status": event["status"], "message": event["message"]}))
