from .tasks import sample_task
from django.http import HttpResponse, HttpRequest

def sample_view(request: HttpRequest):
    sample_task.delay(request.GET)
    print("@@ Task initiated with data: " + str(request.GET))
    return HttpResponse("Task initiated with data: " + str(request.GET))

