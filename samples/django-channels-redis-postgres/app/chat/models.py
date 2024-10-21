from django.db import models

class ChatMessage(models.Model):
    user = models.CharField(max_length=50)
    message = models.TextField()
    room = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"