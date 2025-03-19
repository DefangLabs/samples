from django.shortcuts import render
from .tasks import sample_task
from django.http import HttpResponse, HttpRequest, HttpResponseRedirect, JsonResponse
from django_celery.celery import app as celery_app
import logging

logger = logging.getLogger(__name__)

def add(request: HttpRequest):
    """
    Add a task to the queue.
    """
    get = dict(request.GET)
    sample_task.delay(get)
    
    # set session var to show the task has been added
    request.session["task_added"] = f'Task added with param: {get}'

    # redirect to home
    return HttpResponseRedirect("/")

def home(request: HttpRequest):
    """
    Show counts of tasks in the queue.
    """
    inspector = celery_app.control.inspect()

    added_task = request.session.get("task_added")
    if added_task:
        del request.session["task_added"]
    
    # Initialize default values
    active_counts = {}
    scheduled_counts = {}
    reserved_counts = {}
    total_active = 0
    total_scheduled = 0
    total_reserved = 0

    show_status = request.GET.get('status') == 'true'
    
    # Only load inspector data if status=true in the URL
    if show_status:
        # Get the raw data
        active_tasks = inspector.active() or {}
        scheduled_tasks = inspector.scheduled() or {}
        reserved_tasks = inspector.reserved() or {}
        
        # Calculate counts per worker
        active_counts = {worker: len(tasks) for worker, tasks in active_tasks.items()}
        scheduled_counts = {worker: len(tasks) for worker, tasks in scheduled_tasks.items()}
        reserved_counts = {worker: len(tasks) for worker, tasks in reserved_tasks.items()}
        
        # Calculate totals
        total_active = sum(active_counts.values())
        total_scheduled = sum(scheduled_counts.values())
        total_reserved = sum(reserved_counts.values())

    context = {
        "active": {
            "per_worker": active_counts,
            "total": total_active
        },
        "scheduled": {
            "per_worker": scheduled_counts,
            "total": total_scheduled
        },
        "reserved": {
            "per_worker": reserved_counts,
            "total": total_reserved
        },
        "added_task": added_task,
        "show_status": show_status
    }
    
    return render(request, "tasks/home.html", context)

def health(request: HttpRequest):
    """
    Health check endpoint.
    """
    return HttpResponse("Healthy")


