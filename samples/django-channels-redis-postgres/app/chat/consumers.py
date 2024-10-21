import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from pydantic import BaseModel
from .models import ChatMessage

class MessagePayload(BaseModel):
    user: str = "Anonymous"
    message: str
    timestamp: float = None

class GroupPayload(MessagePayload):
    type: str

class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"
        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name, self.channel_name
        )
        self.accept()

    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name, self.channel_name
        )

    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        payload = MessagePayload(**text_data_json)
        message = payload.message

        persisted = ChatMessage.objects.create(
            user=payload.user,
            message=message,
            room=self.room_name,
        )

        group_payload = GroupPayload(
            type="chat_message", 
            message=message,
            user=payload.user,
            timestamp=int(persisted.timestamp.timestamp() * 1000)
        )

        # Send message to room group
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name, group_payload.model_dump()
        )

    # Receive message from room group
    def chat_message(self, event):
        payload = GroupPayload(**event)
        message_payload = MessagePayload(
            user=payload.user,
            message=payload.message,
            timestamp=payload.timestamp,
        )

        # Send message to WebSocket
        self.send(text_data=message_payload.model_dump_json())