"""
Celery configuration for Donut Trainer
"""
import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'donut_trainer.settings')

app = Celery('donut_trainer')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Task routing
app.conf.task_routes = {
    'training.tasks.train_donut_model': {'queue': 'training'},
    'training.tasks.process_document': {'queue': 'processing'},
}

# Task configuration
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_time_limit=180 * 60,  # 3 hours
    task_soft_time_limit=170 * 60,  # 2 hours 50 minutes
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)

# Periodic task schedule
app.conf.beat_schedule = {
    'auto-promote-models': {
        'task': 'training.tasks.auto_promote_models',
        'schedule': 60.0 * 60 * 6,  # Every 6 hours
    },
    'monitor-model-health': {
        'task': 'training.tasks.monitor_model_health',
        'schedule': 60.0 * 30,  # Every 30 minutes
    },
    'optimize-model-cache': {
        'task': 'training.tasks.optimize_model_cache',
        'schedule': 60.0 * 60 * 2,  # Every 2 hours
    },
    'cleanup-old-files': {
        'task': 'training.tasks.cleanup_old_files',
        'schedule': 60.0 * 60 * 24,  # Daily
    },
    'backup-models': {
        'task': 'training.tasks.backup_models',
        'schedule': 60.0 * 60 * 24 * 7,  # Weekly
    },
}


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
