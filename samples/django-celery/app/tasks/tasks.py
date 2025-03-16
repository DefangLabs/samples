from __future__ import absolute_import, unicode_literals
from celery import shared_task

@shared_task
def sample_task(param=None):
    """
    A sample task that can be called asynchronously
    """
    return f"Task completed with param: {param}"
