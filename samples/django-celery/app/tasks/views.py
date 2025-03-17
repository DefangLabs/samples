from .tasks import sample_task
from django.http import HttpResponse, HttpRequest, JsonResponse
from django_celery.celery import app as celery_app

def add(request: HttpRequest):
    """
    Add a task to the queue.
    """
    get = dict(request.GET)
    sample_task.delay(get)
    return HttpResponse(f"Task initiated with data: {get}")

def status(request: HttpRequest):
    """
    Show information about the task queue.
    """
    return JsonResponse({
        "active": celery_app.control.inspect().active(),
        "scheduled": celery_app.control.inspect().scheduled(),
        "reserved": celery_app.control.inspect().reserved(),
    })

def health(request: HttpRequest):
    """
    Health check endpoint.
    """
    return HttpResponse("Healthy")
    

