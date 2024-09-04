from django.shortcuts import render
from .models import ChatMessage


def index(request):
    return render(request, "chat/index.html")


def room(request, room_name):
    latest_20_messages = ChatMessage.objects.filter(
        room=room_name).order_by("-timestamp")[:20]
    
    return render(request, "chat/room.html", {
        "room_name": room_name,
        "messages": [{
            "user": message.user,
            "message": message.message,
            "timestamp": int(message.timestamp.timestamp() * 1000),
        } for message in latest_20_messages[::-1]],
    })
