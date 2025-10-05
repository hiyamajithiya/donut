"""
Celery tasks for training and document processing
"""
import os
import logging
from pathlib import Path
from celery import shared_task
from django.utils import timezone
from PIL import Image
import pdf2image

from .train import train_donut_model as _train_donut_model
from .models import TrainingJob
from documents.models import Document, DocumentProcessingLog

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def train_donut_model(self, job_id: str):
    """
    Celery task for training Donut model
    Args:
        job_id: Training job UUID
    """
    try:
        logger.info(f"Starting training job {job_id}")

        # Check if job exists and is in pending state
        job = TrainingJob.objects.get(id=job_id)
        if job.status != 'pending':
            raise ValueError(f"Job {job_id} is not in pending state: {job.status}")

        # Call the actual training function
        _train_donut_model(job_id)

        logger.info(f"Training job {job_id} completed successfully")
        return {"status": "success", "job_id": job_id}

    except TrainingJob.DoesNotExist:
        error_msg = f"Training job {job_id} not found"
        logger.error(error_msg)
        return {"status": "error", "message": error_msg}

    except Exception as exc:
        logger.error(f"Training job {job_id} failed: {str(exc)}")

        # Update job status
        try:
            job = TrainingJob.objects.get(id=job_id)
            job.status = 'failed'
            job.error_message = str(exc)
            job.completed_at = timezone.now()
            job.save()
        except TrainingJob.DoesNotExist:
            pass

        # Retry logic
        if self.request.retries < self.max_retries:
            logger.info(f"Retrying training job {job_id} (attempt {self.request.retries + 1})")
            raise self.retry(countdown=60 * (self.request.retries + 1))  # Exponential backoff

        return {"status": "error", "message": str(exc)}


@shared_task(bind=True)
def process_document(self, document_id: str):
    """
    Process uploaded document (convert PDF to images, extract text, etc.)
    Args:
        document_id: Document UUID
    """
    try:
        logger.info(f"Processing document {document_id}")

        # Get document
        document = Document.objects.get(id=document_id)
        document.status = 'processing'
        document.save()

        # Log processing start
        DocumentProcessingLog.objects.create(
            document=document,
            action='processing_started',
            message='Document processing started'
        )

        # Process based on file type
        file_path = document.file.path
        file_ext = Path(file_path).suffix.lower()

        if file_ext == '.pdf':
            # Convert PDF to images
            images = pdf2image.convert_from_path(file_path)
            document.page_count = len(images)

            # Save first page as preview
            if images:
                preview_path = file_path.replace('.pdf', '_preview.jpg')
                images[0].save(preview_path, 'JPEG', quality=85)

                # Update document with preview
                document.extracted_text = f"PDF with {len(images)} pages"

        elif file_ext in ['.jpg', '.jpeg', '.png', '.tiff']:
            # Process image
            try:
                with Image.open(file_path) as img:
                    document.page_count = 1
                    document.extracted_text = f"Image: {img.format} {img.size}"
            except Exception as e:
                raise ValueError(f"Invalid image file: {str(e)}")

        else:
            raise ValueError(f"Unsupported file type: {file_ext}")

        # Update document status
        document.status = 'completed'
        document.save()

        # Log success
        DocumentProcessingLog.objects.create(
            document=document,
            action='processing_completed',
            message=f'Document processed successfully. Pages: {document.page_count}'
        )

        logger.info(f"Document {document_id} processed successfully")
        return {"status": "success", "document_id": document_id, "pages": document.page_count}

    except Document.DoesNotExist:
        error_msg = f"Document {document_id} not found"
        logger.error(error_msg)
        return {"status": "error", "message": error_msg}

    except Exception as exc:
        logger.error(f"Document processing failed for {document_id}: {str(exc)}")

        # Update document status
        try:
            document = Document.objects.get(id=document_id)
            document.status = 'error'
            document.save()

            # Log error
            DocumentProcessingLog.objects.create(
                document=document,
                action='processing_failed',
                message=str(exc),
                error=str(exc)
            )
        except Document.DoesNotExist:
            pass

        return {"status": "error", "message": str(exc)}


@shared_task
def cleanup_old_files():
    """
    Cleanup old training files and temporary data
    """
    try:
        from datetime import timedelta
        from django.utils import timezone

        # Delete training files older than 30 days
        cutoff_date = timezone.now() - timedelta(days=30)

        # Find old training jobs
        old_jobs = TrainingJob.objects.filter(
            completed_at__lt=cutoff_date,
            status__in=['completed', 'failed', 'cancelled']
        )

        deleted_count = 0
        for job in old_jobs:
            if job.model_path and Path(job.model_path).exists():
                # Remove model files
                import shutil
                shutil.rmtree(job.model_path, ignore_errors=True)
                deleted_count += 1

        logger.info(f"Cleaned up {deleted_count} old training directories")
        return {"status": "success", "deleted_count": deleted_count}

    except Exception as exc:
        logger.error(f"Cleanup task failed: {str(exc)}")
        return {"status": "error", "message": str(exc)}


@shared_task
def backup_models():
    """
    Backup production models
    """
    try:
        from .models import TrainedModel
        import shutil
        from datetime import datetime

        # Find production models
        production_models = TrainedModel.objects.filter(is_production=True)

        backup_dir = Path("backups") / datetime.now().strftime("%Y%m%d")
        backup_dir.mkdir(parents=True, exist_ok=True)

        backed_up = 0
        for model in production_models:
            if Path(model.model_path).exists():
                backup_path = backup_dir / f"model_{model.id}"
                shutil.copytree(
                    Path(model.model_path).parent,
                    backup_path,
                    dirs_exist_ok=True
                )
                backed_up += 1

        logger.info(f"Backed up {backed_up} production models")
        return {"status": "success", "backed_up": backed_up}

    except Exception as exc:
        logger.error(f"Backup task failed: {str(exc)}")
        return {"status": "error", "message": str(exc)}


@shared_task
def evaluate_model_performance(model_id: str):
    """
    Evaluate model performance on validation data
    """
    try:
        from .models import TrainedModel, ModelEvaluation
        from .donut_utils import DonutInference
        from documents.models import Document

        model = TrainedModel.objects.get(id=model_id)

        # Get validation documents
        val_docs = Document.objects.filter(
            document_type=model.document_type,
            status='labeled'
        ).select_related('label')[:50]  # Limit to 50 docs for evaluation

        if not val_docs:
            return {"status": "error", "message": "No validation documents found"}

        # Initialize inference
        inference = DonutInference(
            model_path=Path(model.model_path).parent
        )

        results = []
        for doc in val_docs:
            if hasattr(doc, 'label') and doc.label.label_data:
                # Run inference
                prediction = inference.extract(
                    doc.file.path,
                    doc_type=model.document_type.name
                )

                # Calculate metrics
                gt = doc.label.label_data
                is_exact_match = prediction == gt

                # Count matching fields
                pred_fields = set(prediction.keys()) if isinstance(prediction, dict) else set()
                gt_fields = set(gt.keys()) if isinstance(gt, dict) else set()
                all_fields = pred_fields.union(gt_fields)

                field_matches = 0
                for field in all_fields:
                    if field in prediction and field in gt:
                        if prediction[field] == gt[field]:
                            field_matches += 1

                # Save evaluation
                evaluation = ModelEvaluation.objects.create(
                    model=model,
                    document=doc,
                    predicted_json=prediction,
                    ground_truth_json=gt,
                    is_exact_match=is_exact_match,
                    field_matches=field_matches,
                    total_fields=len(all_fields),
                    inference_time=1.0  # TODO: Measure actual inference time
                )

                results.append({
                    'document_id': str(doc.id),
                    'exact_match': is_exact_match,
                    'field_accuracy': field_matches / len(all_fields) if all_fields else 0
                })

        # Calculate overall metrics
        total_docs = len(results)
        exact_matches = sum(1 for r in results if r['exact_match'])
        avg_field_accuracy = sum(r['field_accuracy'] for r in results) / total_docs

        # Update model metrics
        model.json_exact_match = (exact_matches / total_docs * 100) if total_docs > 0 else 0
        model.field_accuracy = avg_field_accuracy * 100
        model.save()

        logger.info(f"Model {model_id} evaluation completed")
        return {
            "status": "success",
            "model_id": model_id,
            "total_docs": total_docs,
            "exact_match_pct": model.json_exact_match,
            "field_accuracy_pct": model.field_accuracy
        }

    except Exception as exc:
        logger.error(f"Model evaluation failed for {model_id}: {str(exc)}")
        return {"status": "error", "message": str(exc)}


@shared_task
def auto_promote_models():
    """
    Automatically promote models that meet promotion criteria
    """
    try:
        from .model_manager import model_manager

        promotion_results = model_manager.auto_promote_models()

        promoted_count = len([r for r in promotion_results if r.get('action') == 'promoted'])

        logger.info(f"Auto-promotion completed: {promoted_count} models promoted")

        return {
            "status": "success",
            "promoted_count": promoted_count,
            "total_evaluated": len(promotion_results),
            "results": promotion_results
        }

    except Exception as exc:
        logger.error(f"Auto-promotion failed: {str(exc)}")
        return {"status": "error", "message": str(exc)}


@shared_task
def monitor_model_health():
    """
    Monitor overall model health and send alerts if needed
    """
    try:
        from .model_manager import model_manager

        health_status = model_manager.get_model_health()

        # Check for issues
        issues = []

        if health_status['overall_status'] != 'healthy':
            issues.append(f"Overall status is {health_status['overall_status']}")

        for doc_type, status in health_status['document_types'].items():
            if not status['has_production_model']:
                issues.append(f"No production model for {doc_type}")

            # Check if model hasn't been used recently (24 hours)
            if status['last_inference']:
                from datetime import datetime, timedelta
                last_inference = datetime.fromisoformat(status['last_inference'].replace('Z', '+00:00'))
                if datetime.now().replace(tzinfo=None) - last_inference.replace(tzinfo=None) > timedelta(hours=24):
                    issues.append(f"Model for {doc_type} hasn't been used in 24+ hours")

        # Clean up expired A/B tests
        model_manager.cleanup_expired_tests()

        result = {
            "status": "success",
            "health_status": health_status,
            "issues": issues,
            "timestamp": datetime.now().isoformat()
        }

        if issues:
            logger.warning(f"Model health issues detected: {issues}")

        return result

    except Exception as exc:
        logger.error(f"Model health monitoring failed: {str(exc)}")
        return {"status": "error", "message": str(exc)}


@shared_task
def optimize_model_cache():
    """
    Optimize model cache based on usage patterns
    """
    try:
        from .inference_engine import inference_engine

        # Get current cache status
        cache_info = inference_engine.model_cache

        # Get usage statistics
        stats = inference_engine.get_model_stats()

        # Clear cache if memory usage is high
        # This is a simple strategy - in production, you might want more sophisticated logic
        if len(cache_info.models) >= cache_info.max_models:
            # Find least used models
            least_used = min(stats.items(), key=lambda x: x[1].get('total_inferences', 0))

            logger.info(f"Cache optimization: considering eviction of model {least_used[0]}")

        return {
            "status": "success",
            "cached_models": len(cache_info.models),
            "max_cache_size": cache_info.max_models,
            "total_models_tracked": len(stats)
        }

    except Exception as exc:
        logger.error(f"Cache optimization failed: {str(exc)}")
        return {"status": "error", "message": str(exc)}