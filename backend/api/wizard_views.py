"""
Simplified Wizard API Views
Handles the complete wizard flow for model training
"""
from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
import json
import uuid

from documents.models import DocumentType, Document, DocumentLabel
from training.models import TrainingDataset, TrainingJob, TrainedModel
from documents.serializers import DocumentTypeSerializer
from training.serializers import TrainingJobSerializer, TrainedModelSerializer


class WizardConfigView(views.APIView):
    """
    Create or update a model configuration via the wizard
    """
    permission_classes = []  # Allow unauthenticated access for development

    def post(self, request):
        """
        Save wizard configuration and create training dataset
        Expected payload:
        {
            "documentType": "invoice",
            "modelName": "Invoice Model v1",
            "fields": [
                {"id": "field-1", "name": "Invoice Number", "type": "text", "required": true},
                ...
            ],
            "documents": [...],  # Files uploaded separately
            "annotations": {
                "doc-id": {
                    "field-id": {"annotated": true, "area": {...}}
                }
            }
        }
        """
        try:
            with transaction.atomic():
                # Extract data
                document_type_name = request.data.get('documentType')
                model_name = request.data.get('modelName')
                fields = request.data.get('fields', [])
                annotations = request.data.get('annotations', {})

                # Validate required fields
                if not document_type_name or not model_name:
                    return Response(
                        {'error': 'documentType and modelName are required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if not fields or len(fields) == 0:
                    return Response(
                        {'error': 'At least one field must be defined'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Get or create document type
                doc_type, created = DocumentType.objects.get_or_create(
                    name=document_type_name.lower().replace(' ', '_'),
                    defaults={
                        'display_name': document_type_name,
                        'schema': {'fields': fields},
                        'description': f'Custom document type created via wizard'
                    }
                )

                if not created:
                    # Update schema if document type already exists
                    doc_type.schema = {'fields': fields}
                    doc_type.save()

                # Create training dataset
                # For development: get or create default user
                from django.contrib.auth import get_user_model
                User = get_user_model()
                default_user = User.objects.first()

                # If no user exists, create a default one for development
                if not default_user:
                    default_user = User.objects.create_user(
                        username='dev',
                        email='dev@example.com',
                        password='dev123'
                    )

                dataset = TrainingDataset.objects.create(
                    name=model_name,
                    description=f'Training dataset for {document_type_name}',
                    document_type=doc_type,
                    user=default_user,
                    train_split=0.8,
                    val_split=0.1,
                    test_split=0.1
                )

                # Return configuration ID
                return Response({
                    'configId': str(dataset.id),
                    'dataset': {
                        'id': str(dataset.id),
                        'name': dataset.name,
                        'document_type': doc_type.name,
                        'document_type_display': doc_type.display_name,
                        'fields': fields,
                        'created_at': dataset.created_at.isoformat()
                    }
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': f'Failed to save configuration: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class WizardDocumentUploadView(views.APIView):
    """
    Handle document uploads for the wizard
    """
    permission_classes = []  # Allow unauthenticated access for development

    def post(self, request):
        """
        Upload training documents
        """
        try:
            dataset_id = request.data.get('dataset_id')
            files = request.FILES.getlist('files')

            if not dataset_id:
                return Response(
                    {'error': 'dataset_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not files:
                return Response(
                    {'error': 'No files provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get dataset
            try:
                dataset = TrainingDataset.objects.get(id=dataset_id)
            except TrainingDataset.DoesNotExist:
                return Response(
                    {'error': 'Dataset not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Get or create default user for development
            from django.contrib.auth import get_user_model
            User = get_user_model()
            default_user = User.objects.first()

            # If no user exists, create a default one for development
            if not default_user:
                default_user = User.objects.create_user(
                    username='dev',
                    email='dev@example.com',
                    password='dev123'
                )

            # Upload documents
            uploaded_docs = []
            for file in files:
                document = Document.objects.create(
                    user=default_user,
                    document_type=dataset.document_type,
                    file=file,
                    original_filename=file.name,
                    file_size=file.size,
                    status='uploaded'
                )
                uploaded_docs.append({
                    'id': str(document.id),
                    'filename': document.original_filename,
                    'size': document.file_size,
                    'status': document.status
                })

            # Update dataset statistics
            dataset.total_documents = Document.objects.filter(
                document_type=dataset.document_type
            ).count()
            dataset.save()

            return Response({
                'documents': uploaded_docs,
                'total_count': len(uploaded_docs)
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': f'Upload failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class WizardAnnotationView(views.APIView):
    """
    Save annotations for training documents
    """
    permission_classes = []  # Allow unauthenticated access for development

    def post(self, request):
        """
        Save document annotations
        Expected payload:
        {
            "dataset_id": "uuid",
            "document_id": "uuid",
            "annotations": {
                "field_id": {"value": "extracted value", "confidence": 1.0, "bbox": [...]}
            }
        }
        """
        try:
            dataset_id = request.data.get('dataset_id')
            document_id = request.data.get('document_id')
            annotations = request.data.get('annotations', {})

            if not all([dataset_id, document_id]):
                return Response(
                    {'error': 'dataset_id and document_id are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get dataset and document
            try:
                dataset = TrainingDataset.objects.get(id=dataset_id)
                document = Document.objects.get(id=document_id)
            except (TrainingDataset.DoesNotExist, Document.DoesNotExist):
                return Response(
                    {'error': 'Dataset or document not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Get or create default user for development
            from django.contrib.auth import get_user_model
            User = get_user_model()
            default_user = User.objects.first()

            # If no user exists, create a default one for development
            if not default_user:
                default_user = User.objects.create_user(
                    username='dev',
                    email='dev@example.com',
                    password='dev123'
                )

            # Create or update document label
            label, created = DocumentLabel.objects.update_or_create(
                document=document,
                defaults={
                    'label_data': annotations,
                    'labeled_by': default_user,
                    'is_validated': True
                }
            )

            # Update document status
            document.status = 'labeled'
            document.save()

            # Update dataset statistics
            dataset.labeled_documents = DocumentLabel.objects.filter(
                document__document_type=dataset.document_type
            ).count()
            dataset.save()

            return Response({
                'label_id': str(label.id),
                'document_id': str(document.id),
                'status': 'labeled',
                'labeled_count': dataset.labeled_documents
            }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': f'Annotation save failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class WizardTrainingView(views.APIView):
    """
    Start training from wizard configuration
    """
    permission_classes = []  # Allow unauthenticated access for development

    def post(self, request):
        """
        Start model training
        Expected payload:
        {
            "dataset_id": "uuid",
            "epochs": 10,
            "batch_size": 8,
            "learning_rate": 5e-5
        }
        """
        try:
            dataset_id = request.data.get('dataset_id')
            epochs = request.data.get('epochs', 10)
            batch_size = request.data.get('batch_size', 8)
            learning_rate = request.data.get('learning_rate', 5e-5)

            if not dataset_id:
                return Response(
                    {'error': 'dataset_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get dataset
            try:
                dataset = TrainingDataset.objects.get(id=dataset_id)
            except TrainingDataset.DoesNotExist:
                return Response(
                    {'error': 'Dataset not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Get or create default user for development
            from django.contrib.auth import get_user_model
            User = get_user_model()
            default_user = User.objects.first()

            # If no user exists, create a default one for development
            if not default_user:
                default_user = User.objects.create_user(
                    username='dev',
                    email='dev@example.com',
                    password='dev123'
                )

            # Validate dataset has enough labeled documents (reduced to 1 for development)
            if dataset.labeled_documents < 1:
                return Response(
                    {'error': f'At least 1 labeled document required. Currently: {dataset.labeled_documents}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create training job
            training_job = TrainingJob.objects.create(
                dataset=dataset,
                user=default_user,
                base_model='naver-clova-ix/donut-base',
                epochs=epochs,
                batch_size=batch_size,
                learning_rate=learning_rate,
                status='pending'
            )

            # Start training (in real implementation, this would trigger a Celery task)
            # For now, we'll just simulate starting the training
            training_job.status = 'preparing'
            training_job.started_at = timezone.now()
            training_job.save()

            # In production, trigger training task:
            # from training.tasks import train_donut_model
            # task = train_donut_model.delay(str(training_job.id))

            # For development/demo: Simulate training completion
            # In production, this would be done by the training task when it completes
            import threading
            def simulate_training_completion():
                import time
                time.sleep(10)  # Simulate 10 seconds of training

                from training.models import TrainedModel

                # Update training job to completed
                training_job.status = 'completed'
                training_job.completed_at = timezone.now()
                training_job.current_epoch = epochs
                training_job.current_step = 100
                training_job.total_steps = 100
                training_job.save()

                # Create trained model
                TrainedModel.objects.create(
                    name=dataset.name,
                    description=f'Trained model for {dataset.document_type.display_name}',
                    document_type=dataset.document_type,
                    training_job=training_job,
                    version='1.0.0',
                    model_path=f'models/{training_job.id}/model.pt',
                    config_path=f'models/{training_job.id}/config.json',
                    status='active',
                    field_accuracy=95.0,
                    overall_accuracy=93.5,
                    is_production_ready=True
                )

            # Start simulation thread
            thread = threading.Thread(target=simulate_training_completion)
            thread.daemon = True
            thread.start()

            serializer = TrainingJobSerializer(training_job)

            return Response({
                'training_job_id': str(training_job.id),
                'training_job': serializer.data,
                'message': 'Training job created successfully'
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': f'Training start failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class WizardStatusView(views.APIView):
    """
    Get training status for wizard
    """
    permission_classes = []  # Allow unauthenticated access for development

    def get(self, request):
        """
        Get training job status
        """
        training_job_id = request.query_params.get('training_job_id')

        if not training_job_id:
            return Response(
                {'error': 'training_job_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            training_job = TrainingJob.objects.get(id=training_job_id)
        except TrainingJob.DoesNotExist:
            return Response(
                {'error': 'Training job not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = TrainingJobSerializer(training_job)

        # Add computed progress
        progress_percentage = 0
        if training_job.total_steps and training_job.current_step:
            progress_percentage = int((training_job.current_step / training_job.total_steps) * 100)
        elif training_job.status == 'completed':
            progress_percentage = 100
        elif training_job.status == 'training':
            # Estimate progress from epochs
            if training_job.epochs and training_job.current_epoch:
                progress_percentage = int((training_job.current_epoch / training_job.epochs) * 100)

        response_data = serializer.data
        response_data['progress'] = progress_percentage
        response_data['current_epoch'] = training_job.current_epoch or 0

        return Response(response_data)


class WizardModelsView(views.APIView):
    """
    List all trained models for the user
    """
    permission_classes = []  # Allow unauthenticated access for development

    def get(self, request):
        """
        Get all trained models (all users for development)
        """
        # For development: return all models
        # For production: filter by request.user when authentication is implemented
        models = TrainedModel.objects.all().select_related('document_type', 'training_job')

        serializer = TrainedModelSerializer(models, many=True)

        return Response({
            'models': serializer.data,
            'total_count': models.count()
        })
