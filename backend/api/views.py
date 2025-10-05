from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
import os

from documents.models import Document, DocumentType, DocumentLabel
from documents.serializers import (
    DocumentSerializer, DocumentUploadSerializer,
    DocumentLabelSerializer, DocumentTypeSerializer
)
from training.models import (
    TrainingDataset, TrainingJob, TrainedModel,
    Feedback, ModelEvaluation
)
from training.serializers import (
    TrainingDatasetSerializer, TrainingJobSerializer,
    TrainingJobCreateSerializer, TrainedModelSerializer,
    FeedbackSerializer, ExtractRequestSerializer,
    ExtractResponseSerializer
)


class DocumentTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for document types"""
    queryset = DocumentType.objects.all()
    serializer_class = DocumentTypeSerializer
    permission_classes = [IsAuthenticated]


class DocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for document management"""
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return DocumentUploadSerializer
        return DocumentSerializer

    def perform_create(self, serializer):
        """Save document and trigger processing"""
        document = serializer.save()

        # Trigger document processing task
        from training.tasks import process_document
        process_document.delay(str(document.id))

    @action(detail=True, methods=['post'])
    def label(self, request, pk=None):
        """Save label for a document"""
        document = self.get_object()
        serializer = DocumentLabelSerializer(data=request.data)

        if serializer.is_valid():
            # Check if label already exists
            if hasattr(document, 'label'):
                # Update existing label
                label = document.label
                for attr, value in serializer.validated_data.items():
                    setattr(label, attr, value)
                label.labeled_by = request.user
                label.save()
            else:
                # Create new label
                serializer.save(
                    document=document,
                    labeled_by=request.user
                )

            # Update document status
            document.status = 'labeled'
            document.save()

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TrainingDatasetViewSet(viewsets.ModelViewSet):
    """ViewSet for training datasets"""
    serializer_class = TrainingDatasetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TrainingDataset.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TrainingJobViewSet(viewsets.ModelViewSet):
    """ViewSet for training jobs"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TrainingJob.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return TrainingJobCreateSerializer
        return TrainingJobSerializer

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start a training job"""
        job = self.get_object()

        if job.status != 'pending':
            return Response(
                {'error': 'Job is not in pending state'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Trigger Celery task for training
        from training.tasks import train_donut_model
        task = train_donut_model.delay(str(job.id))

        job.status = 'preparing'
        job.save()

        return Response({
            'status': 'Training job started',
            'task_id': task.id
        })

    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Get training job status and progress"""
        job = self.get_object()
        serializer = self.get_serializer(job)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a training job"""
        job = self.get_object()

        if job.status in ['completed', 'failed', 'cancelled']:
            return Response(
                {'error': 'Job cannot be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )

        job.status = 'cancelled'
        job.save()

        return Response({'status': 'Training job cancelled'})


class TrainedModelViewSet(viewsets.ModelViewSet):
    """ViewSet for trained models"""
    serializer_class = TrainedModelSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TrainedModel.objects.filter(
            training_job__user=self.request.user
        )

    @action(detail=True, methods=['post'])
    def promote(self, request, pk=None):
        """Promote a model to production"""
        model = self.get_object()

        # Deactivate previous production model
        TrainedModel.objects.filter(
            document_type=model.document_type,
            is_production=True
        ).update(is_production=False, status='inactive')

        # Activate this model
        model.is_production = True
        model.status = 'active'
        model.promoted_by = request.user
        model.save()

        return Response({'status': 'Model promoted to production'})


class ExtractView(views.APIView):
    """Extract data from documents using trained model"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ExtractRequestSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        file = serializer.validated_data['file']
        doc_type = serializer.validated_data.get('document_type')
        model_version = serializer.validated_data.get('model_version')

        # Save uploaded file temporarily
        import tempfile
        import os
        from pathlib import Path

        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            for chunk in file.chunks():
                tmp_file.write(chunk)
            tmp_file_path = tmp_file.name

        try:
            # Use the new inference engine
            from training.inference_engine import inference_engine

            confidence_threshold = request.data.get('confidence_threshold', 0.5)

            result = inference_engine.extract(
                tmp_file_path,
                doc_type=doc_type,
                model_version=model_version,
                confidence_threshold=confidence_threshold
            )

            response_data = result

        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Extraction failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        finally:
            # Clean up temporary file
            os.unlink(tmp_file_path)

        return Response(response_data)


class BatchExtractView(views.APIView):
    """Extract data from multiple documents in batch"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        files = request.FILES.getlist('files')
        doc_types = request.data.getlist('doc_types', [])
        batch_size = int(request.data.get('batch_size', 4))

        if not files:
            return Response(
                {'error': 'No files provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Pad doc_types list if needed
        if len(doc_types) < len(files):
            doc_types.extend([None] * (len(files) - len(doc_types)))

        # Save all files temporarily
        temp_files = []
        try:
            import tempfile
            import os

            for file in files:
                tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
                for chunk in file.chunks():
                    tmp_file.write(chunk)
                tmp_file.close()
                temp_files.append(tmp_file.name)

            # Process batch
            from training.inference_engine import inference_engine

            results = inference_engine.batch_extract(
                temp_files,
                doc_types[:len(temp_files)],
                batch_size=batch_size
            )

            return Response({
                'results': results,
                'total_processed': len(results),
                'batch_size': batch_size
            })

        except Exception as e:
            return Response(
                {'error': f'Batch extraction failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        finally:
            # Clean up temporary files
            for temp_file in temp_files:
                try:
                    os.unlink(temp_file)
                except:
                    pass


class ModelHealthView(views.APIView):
    """Health check for inference models"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from training.inference_engine import inference_engine

        health_info = inference_engine.health_check()
        return Response(health_info)


class ModelStatsView(views.APIView):
    """Get model performance statistics"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        model_id = request.query_params.get('model_id')

        from training.inference_engine import inference_engine

        if model_id:
            stats = inference_engine.get_model_stats(model_id)
            if not stats:
                return Response(
                    {'error': 'Model not found or no stats available'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            stats = inference_engine.get_model_stats()

        return Response(stats)


class FeedbackViewSet(viewsets.ModelViewSet):
    """ViewSet for user feedback on model predictions"""
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Feedback.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ModelManagementView(views.APIView):
    """Advanced model management operations"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        action = request.data.get('action')

        if action == 'auto_promote':
            from training.tasks import auto_promote_models
            task = auto_promote_models.delay()
            return Response({
                'task_id': task.id,
                'message': 'Auto-promotion task started'
            })

        elif action == 'create_ab_test':
            from training.model_manager import model_manager

            doc_type = request.data.get('document_type')
            challenger_id = request.data.get('challenger_model_id')
            traffic_split = float(request.data.get('traffic_split', 0.1))
            duration_days = int(request.data.get('duration_days', 7))

            result = model_manager.create_challenger_test(
                doc_type, challenger_id, traffic_split, duration_days
            )

            if 'error' in result:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)

            return Response(result)

        elif action == 'get_ab_results':
            from training.model_manager import model_manager

            test_id = request.data.get('test_id')
            if not test_id:
                return Response(
                    {'error': 'test_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            results = model_manager.ab_test_manager.get_test_results(test_id)
            return Response(results)

        elif action == 'monitor_health':
            from training.tasks import monitor_model_health
            task = monitor_model_health.delay()
            return Response({
                'task_id': task.id,
                'message': 'Health monitoring task started'
            })

        else:
            return Response(
                {'error': 'Invalid action. Supported actions: auto_promote, create_ab_test, get_ab_results, monitor_health'},
                status=status.HTTP_400_BAD_REQUEST
            )


class ModelAnalyticsView(views.APIView):
    """Model analytics and insights"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from training.models import TrainedModel, ModelEvaluation
        from documents.models import DocumentType
        from django.db.models import Avg, Count, Q
        from datetime import datetime, timedelta

        # Get analytics data
        analytics = {}

        # Overall stats
        analytics['overview'] = {
            'total_models': TrainedModel.objects.count(),
            'production_models': TrainedModel.objects.filter(is_production=True).count(),
            'models_trained_last_30_days': TrainedModel.objects.filter(
                created_at__gte=datetime.now() - timedelta(days=30)
            ).count()
        }

        # Per document type analytics
        doc_types = DocumentType.objects.all()
        analytics['by_document_type'] = {}

        for doc_type in doc_types:
            production_model = TrainedModel.objects.filter(
                document_type=doc_type,
                is_production=True
            ).first()

            analytics['by_document_type'][doc_type.name] = {
                'total_models': TrainedModel.objects.filter(document_type=doc_type).count(),
                'has_production_model': production_model is not None,
                'production_model_accuracy': production_model.field_accuracy if production_model else None,
                'total_inferences': production_model.inference_count if production_model else 0,
                'avg_inference_time': production_model.avg_inference_time if production_model else None
            }

        # Recent evaluations
        recent_evaluations = ModelEvaluation.objects.filter(
            created_at__gte=datetime.now() - timedelta(days=7)
        ).values('model__document_type__name').annotate(
            avg_accuracy=Avg('field_matches') / Avg('total_fields'),
            total_evaluations=Count('id')
        )

        analytics['recent_performance'] = list(recent_evaluations)

        # Model usage trends
        active_models = TrainedModel.objects.filter(
            is_production=True,
            last_used_at__isnull=False
        ).order_by('-inference_count')[:10]

        analytics['top_used_models'] = []
        for model in active_models:
            analytics['top_used_models'].append({
                'model_id': str(model.id),
                'version': model.version,
                'document_type': model.document_type.name,
                'inference_count': model.inference_count,
                'accuracy': model.field_accuracy,
                'last_used': model.last_used_at.isoformat() if model.last_used_at else None
            })

        return Response(analytics)


class ModelComparisonView(views.APIView):
    """Compare multiple models"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        model_ids = request.data.get('model_ids', [])

        if not model_ids or len(model_ids) < 2:
            return Response(
                {'error': 'At least 2 model IDs are required for comparison'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            models = TrainedModel.objects.filter(id__in=model_ids)

            if len(models) != len(model_ids):
                return Response(
                    {'error': 'One or more model IDs not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            comparison = []
            for model in models:
                # Get recent evaluations
                recent_evals = model.evaluations.all()[:20]

                avg_accuracy = 0
                avg_confidence = 0
                if recent_evals:
                    avg_accuracy = sum(e.field_matches / max(e.total_fields, 1) for e in recent_evals) / len(recent_evals)
                    avg_confidence = sum(e.confidence_score or 0.5 for e in recent_evals) / len(recent_evals)

                comparison.append({
                    'model_id': str(model.id),
                    'version': model.version,
                    'document_type': model.document_type.name,
                    'is_production': model.is_production,
                    'status': model.status,
                    'created_at': model.created_at.isoformat(),
                    'metrics': {
                        'field_accuracy': model.field_accuracy,
                        'json_exact_match': model.json_exact_match,
                        'avg_inference_time': model.avg_inference_time,
                        'recent_avg_accuracy': avg_accuracy * 100,
                        'recent_avg_confidence': avg_confidence * 100,
                        'total_evaluations': recent_evals.count()
                    },
                    'usage': {
                        'inference_count': model.inference_count,
                        'last_used_at': model.last_used_at.isoformat() if model.last_used_at else None
                    }
                })

            return Response({
                'models': comparison,
                'comparison_timestamp': datetime.now().isoformat()
            })

        except Exception as e:
            return Response(
                {'error': f'Comparison failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
