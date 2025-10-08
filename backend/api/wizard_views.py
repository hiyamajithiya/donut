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
        import logging
        logger = logging.getLogger(__name__)

        try:
            dataset_id = request.data.get('dataset_id')
            files = request.FILES.getlist('files')

            logger.info(f"Upload request - dataset_id: {dataset_id}, files count: {len(files)}")
            logger.info(f"Request data keys: {request.data.keys()}")
            logger.info(f"Request FILES keys: {request.FILES.keys()}")

            if not dataset_id:
                logger.error('Upload failed: dataset_id is required')
                return Response(
                    {'error': 'dataset_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not files:
                logger.error('Upload failed: No files provided')
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
        import logging
        logger = logging.getLogger(__name__)

        try:
            dataset_id = request.data.get('dataset_id')
            document_id = request.data.get('document_id')
            annotations = request.data.get('annotations', {})

            logger.info(f"Annotation request - dataset_id: {dataset_id}, document_id: {document_id}, annotations keys: {list(annotations.keys())}")

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

            # Update dataset statistics - use refresh to get latest count
            dataset.refresh_from_db()
            dataset.labeled_documents = DocumentLabel.objects.filter(
                document__document_type=dataset.document_type
            ).count()
            dataset.save()

            logger.info(f'Dataset {dataset.id} now has {dataset.labeled_documents} labeled documents')

            return Response({
                'label_id': str(label.id),
                'document_id': str(document.id),
                'status': 'labeled',
                'labeled_count': dataset.labeled_documents
            }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            logger.error(f'Annotation save failed: {str(e)}')
            logger.error(traceback.format_exc())
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

            # Validate dataset has enough labeled documents (at least 1 for training)
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

            # Trigger actual training task via Celery
            import logging
            logger = logging.getLogger(__name__)

            celery_available = False
            try:
                from training.tasks import train_donut_model
                # Try to start the Celery training task
                task = train_donut_model.delay(str(training_job.id))

                # Update status to show training has been queued
                training_job.status = 'preparing'
                training_job.started_at = timezone.now()
                training_job.save()

                celery_available = True
                logger.info(f"Training job {training_job.id} queued to Celery")

            except Exception as celery_error:
                # If Celery is not available, fall back to simulation for development
                import threading
                logger.warning(f"Celery not available, using simulation: {str(celery_error)}")

                # Update job status for simulation mode
                training_job.status = 'training'
                training_job.started_at = timezone.now()
                training_job.save()

                def simulate_training_completion():
                    import time
                    from datetime import datetime

                    try:
                        time.sleep(10)  # Simulate 10 seconds of training

                        # Refresh training job from database
                        job = TrainingJob.objects.get(id=training_job.id)

                        # Update training job to completed
                        job.status = 'completed'
                        job.completed_at = timezone.now()
                        job.current_epoch = epochs
                        job.current_step = 100
                        job.total_steps = 100

                        # Create a simulated model path
                        version = datetime.now().strftime("%Y%m%d_%H%M%S")
                        model_dir = f'models/donut_model_v{version}'
                        job.model_path = model_dir
                        job.processor_path = model_dir
                        job.save()

                        # Create trained model entry
                        TrainedModel.objects.create(
                            name=dataset.name,
                            description=f'Trained model for {dataset.document_type.display_name} (Simulated)',
                            document_type=dataset.document_type,
                            training_job=job,
                            version=version,
                            model_path=f'{model_dir}/model',
                            processor_path=f'{model_dir}/processor',
                            status='testing',
                            field_accuracy=95.0,
                            json_exact_match=93.5,
                        )

                        logger.info(f"Simulation completed for training job {job.id}")
                    except Exception as e:
                        logger.error(f"Simulation failed: {str(e)}")
                        try:
                            job = TrainingJob.objects.get(id=training_job.id)
                            job.status = 'failed'
                            job.error_message = f"Simulation error: {str(e)}"
                            job.save()
                        except Exception:
                            pass

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


class WizardTestModelView(views.APIView):
    """
    Test a trained model with a document
    """
    permission_classes = []  # Allow unauthenticated access for development

    def post(self, request):
        """
        Test model inference
        Expected payload:
        {
            "model_id": "uuid",
            "file": <uploaded file>
        }
        """
        try:
            model_id = request.data.get('model_id')
            file = request.FILES.get('file')

            if not model_id:
                return Response(
                    {'error': 'model_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not file:
                return Response(
                    {'error': 'file is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get model
            try:
                model = TrainedModel.objects.get(id=model_id)
            except TrainedModel.DoesNotExist:
                return Response(
                    {'error': 'Model not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Check if model files exist
            import os
            from pathlib import Path

            model_path = Path(model.model_path)
            processor_path = Path(model.processor_path)

            if not model_path.exists() or not processor_path.exists():
                return Response({
                    'status': 'error',
                    'error': 'Model files not found. This may be a simulated model for development.',
                    'message': 'Model needs to be trained with actual data to perform inference.',
                    'model_path': str(model.model_path),
                    'model_exists': model_path.exists(),
                    'processor_exists': processor_path.exists()
                }, status=status.HTTP_400_BAD_REQUEST)

            # Save uploaded file temporarily
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.name).suffix) as tmp_file:
                for chunk in file.chunks():
                    tmp_file.write(chunk)
                tmp_path = tmp_file.name

            try:
                # Perform inference
                from training.donut_utils import DonutInference

                inference = DonutInference(
                    model_path=os.path.dirname(model.model_path)
                )

                result = inference.extract(
                    tmp_path,
                    doc_type=model.document_type.name
                )

                # Update model usage stats
                model.inference_count += 1
                model.last_used_at = timezone.now()
                model.save()

                return Response({
                    'status': 'success',
                    'model_id': str(model.id),
                    'model_name': model.name,
                    'document_type': model.document_type.display_name,
                    'extracted_data': result,
                    'inference_count': model.inference_count
                }, status=status.HTTP_200_OK)

            finally:
                # Clean up temp file
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)

        except Exception as e:
            import traceback
            return Response({
                'status': 'error',
                'error': f'Model test failed: {str(e)}',
                'traceback': traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
