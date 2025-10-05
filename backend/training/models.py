from django.db import models
from django.contrib.auth.models import User
from documents.models import DocumentType, Document
import uuid
import json


class TrainingDataset(models.Model):
    """Collection of documents for training"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    document_type = models.ForeignKey(DocumentType, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    # Dataset configuration
    train_split = models.FloatField(default=0.8, help_text="Training data split ratio")
    val_split = models.FloatField(default=0.1, help_text="Validation data split ratio")
    test_split = models.FloatField(default=0.1, help_text="Test data split ratio")

    # Statistics
    total_documents = models.IntegerField(default=0)
    labeled_documents = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.document_type.display_name}"

    class Meta:
        ordering = ['-created_at']


class TrainingJob(models.Model):
    """Training job for Donut model"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('preparing', 'Preparing Data'),
        ('training', 'Training'),
        ('evaluating', 'Evaluating'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dataset = models.ForeignKey(TrainingDataset, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    # Training configuration
    base_model = models.CharField(max_length=200, default='naver-clova-ix/donut-base')
    epochs = models.IntegerField(default=10)
    batch_size = models.IntegerField(default=8)
    learning_rate = models.FloatField(default=5e-5)
    weight_decay = models.FloatField(default=0.01)
    gradient_accumulation_steps = models.IntegerField(default=1)
    image_size = models.IntegerField(default=1280, help_text="Max dimension for image resize")

    # Training state
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    current_epoch = models.IntegerField(default=0)
    current_step = models.IntegerField(default=0)
    total_steps = models.IntegerField(null=True, blank=True)

    # Training metrics
    train_loss = models.FloatField(null=True, blank=True)
    val_loss = models.FloatField(null=True, blank=True)
    best_val_loss = models.FloatField(null=True, blank=True)

    # Timing
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    estimated_completion = models.DateTimeField(null=True, blank=True)

    # Outputs
    model_path = models.CharField(max_length=500, blank=True)
    processor_path = models.CharField(max_length=500, blank=True)
    training_logs = models.TextField(blank=True)
    error_message = models.TextField(blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Training {self.id} - {self.get_status_display()}"

    class Meta:
        ordering = ['-created_at']


class TrainedModel(models.Model):
    """Trained Donut models ready for deployment"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('testing', 'Testing'),
        ('archived', 'Archived'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    training_job = models.OneToOneField(TrainingJob, on_delete=models.CASCADE)
    version = models.CharField(max_length=50)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    # Model info
    document_type = models.ForeignKey(DocumentType, on_delete=models.CASCADE)
    model_path = models.CharField(max_length=500)
    processor_path = models.CharField(max_length=500)

    # Performance metrics
    json_exact_match = models.FloatField(null=True, blank=True, help_text="% of exact JSON matches")
    field_accuracy = models.FloatField(null=True, blank=True, help_text="% of correct fields")
    row_recall = models.FloatField(null=True, blank=True, help_text="% of table rows correctly extracted")
    avg_inference_time = models.FloatField(null=True, blank=True, help_text="Average inference time in seconds")

    # Deployment
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='inactive')
    is_production = models.BooleanField(default=False)
    promoted_at = models.DateTimeField(null=True, blank=True)
    promoted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='promoted_models')

    # Usage tracking
    inference_count = models.IntegerField(default=0)
    last_used_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} v{self.version}"

    class Meta:
        ordering = ['-created_at']
        unique_together = ['document_type', 'version']


class TrainingProgress(models.Model):
    """Real-time training progress updates"""
    training_job = models.ForeignKey(TrainingJob, on_delete=models.CASCADE, related_name='progress_updates')
    epoch = models.IntegerField()
    step = models.IntegerField()
    loss = models.FloatField()
    learning_rate = models.FloatField()
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Progress for {self.training_job.id} - Epoch {self.epoch}"


class ModelEvaluation(models.Model):
    """Evaluation results for trained models"""
    model = models.ForeignKey(TrainedModel, on_delete=models.CASCADE, related_name='evaluations')
    document = models.ForeignKey(Document, on_delete=models.CASCADE)

    # Predictions
    predicted_json = models.JSONField()
    ground_truth_json = models.JSONField(null=True, blank=True)

    # Metrics
    is_exact_match = models.BooleanField(default=False)
    field_matches = models.IntegerField(default=0)
    total_fields = models.IntegerField(default=0)
    inference_time = models.FloatField(help_text="Inference time in seconds")

    # Confidence
    confidence_score = models.FloatField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Evaluation for {self.model.name} on {self.document.original_filename}"


class Feedback(models.Model):
    """User feedback on model predictions for active learning"""
    model = models.ForeignKey(TrainedModel, on_delete=models.CASCADE)
    document = models.ForeignKey(Document, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    # Original prediction and correction
    original_prediction = models.JSONField()
    corrected_data = models.JSONField()

    # Feedback metadata
    correction_type = models.CharField(max_length=50, blank=True)  # e.g., 'field_error', 'missing_row', 'format_error'
    notes = models.TextField(blank=True)
    is_processed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Feedback for {self.document.original_filename}"
