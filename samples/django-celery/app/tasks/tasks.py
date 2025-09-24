import random
from celery import shared_task
import time
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

@shared_task
def sample_task(param=None):
    """
    A sample task that can be called asynchronously
    """
    # artificial delay as if the task is doing something
    # random between 1 and 5 sec
    sleep = random.randint(1, 5)

    time.sleep(sleep)

    return f"Task completed with param: {param}"
