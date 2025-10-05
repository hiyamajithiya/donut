from django.db import models
from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
import json
import uuid


class DocumentType(models.Model):
    """Predefined document types with their expected fields"""
    DOCUMENT_CHOICES = [
        ('bank_statement', 'Bank Statement'),
        ('invoice', 'Invoice'),
        ('expense_voucher', 'Expense Voucher'),
        ('form_16', 'Form 16'),
        ('form_16a', 'Form 16A'),
        ('form_26as', 'Form 26AS'),
        ('ais_tis', 'AIS/TIS'),
        ('balance_sheet', 'Balance Sheet'),
        ('profit_loss', 'Profit & Loss'),
        ('tds_form', 'TDS Form'),
        ('gst_form', 'GST Form'),
        ('custom', 'Custom Document'),
    ]

    name = models.CharField(max_length=50, choices=DOCUMENT_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    schema = models.JSONField(help_text="JSON schema for expected fields")
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_name']

    def __str__(self):
        return self.display_name


class Document(models.Model):
    """Uploaded document files"""
    STATUS_CHOICES = [
        ('uploaded', 'Uploaded'),
        ('processing', 'Processing'),
        ('labeled', 'Labeled'),
        ('training', 'Training'),
        ('completed', 'Completed'),
        ('error', 'Error'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    document_type = models.ForeignKey(DocumentType, on_delete=models.SET_NULL, null=True)

    file = models.FileField(
        upload_to='documents/%Y/%m/%d/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png', 'tiff'])]
    )
    original_filename = models.CharField(max_length=255)
    file_size = models.IntegerField(help_text="File size in bytes")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploaded')

    # Processed data
    page_count = models.IntegerField(null=True, blank=True)
    extracted_text = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.original_filename} - {self.get_status_display()}"


class DocumentLabel(models.Model):
    """Labels for training documents"""
    document = models.OneToOneField(Document, on_delete=models.CASCADE, related_name='label')
    label_data = models.JSONField(help_text="Labeled JSON data for training")

    # Validation
    is_validated = models.BooleanField(default=False)
    validation_errors = models.JSONField(null=True, blank=True)

    # Metadata
    labeled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    time_spent_seconds = models.IntegerField(null=True, blank=True, help_text="Time spent labeling in seconds")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def validate_against_schema(self):
        """Validate label data against document type schema"""
        if self.document.document_type and self.document.document_type.schema:
            # Implement validation logic here
            pass
        return True

    def __str__(self):
        return f"Label for {self.document.original_filename}"


class DocumentProcessingLog(models.Model):
    """Log processing steps for documents"""
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='logs')
    action = models.CharField(max_length=50)
    message = models.TextField()
    error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.document.original_filename} - {self.action}"
