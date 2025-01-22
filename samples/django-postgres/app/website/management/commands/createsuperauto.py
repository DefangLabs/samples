from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import logging

class Command(BaseCommand):
    def handle(self, *args, **options):
        User = get_user_model()
        logger = logging.getLogger(__name__)
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'admin')
            logger.info("Superuser 'admin' created automatically")
        else:
            logger.info("Superuser 'admin' already exists")