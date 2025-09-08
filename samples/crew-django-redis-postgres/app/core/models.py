from django.db import models
from pgvector.django import VectorField

# Create your models here.
class Summary(models.Model):
    text = models.TextField()
    embedding = VectorField(dimensions=1024)
    