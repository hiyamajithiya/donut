"""
Production model management system with automatic promotion and A/B testing
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from django.db import transaction
from django.utils import timezone

from .models import TrainedModel, ModelEvaluation, TrainingJob
from documents.models import DocumentType

logger = logging.getLogger(__name__)


class ModelPromotionCriteria:
    """Criteria for automatic model promotion"""

    def __init__(
        self,
        min_accuracy: float = 0.85,
        min_evaluations: int = 10,
        improvement_threshold: float = 0.05,
        confidence_threshold: float = 0.8
    ):
        self.min_accuracy = min_accuracy
        self.min_evaluations = min_evaluations
        self.improvement_threshold = improvement_threshold
        self.confidence_threshold = confidence_threshold

    def evaluate_model(self, model: TrainedModel) -> Dict[str, any]:
        """Evaluate if model meets promotion criteria"""
        evaluation_result = {
            'promotable': False,
            'reasons': [],
            'metrics': {}
        }

        # Check if model has minimum evaluations
        evaluation_count = model.evaluations.count()
        evaluation_result['metrics']['evaluation_count'] = evaluation_count

        if evaluation_count < self.min_evaluations:
            evaluation_result['reasons'].append(
                f'Insufficient evaluations: {evaluation_count} < {self.min_evaluations}'
            )
            return evaluation_result

        # Calculate average metrics
        evaluations = model.evaluations.all()
        avg_accuracy = sum(e.field_matches / max(e.total_fields, 1) for e in evaluations) / len(evaluations)
        avg_confidence = sum(e.confidence_score or 0.5 for e in evaluations) / len(evaluations)

        evaluation_result['metrics']['avg_accuracy'] = avg_accuracy
        evaluation_result['metrics']['avg_confidence'] = avg_confidence

        # Check accuracy threshold
        if avg_accuracy < self.min_accuracy:
            evaluation_result['reasons'].append(
                f'Accuracy too low: {avg_accuracy:.3f} < {self.min_accuracy}'
            )
            return evaluation_result

        # Check confidence threshold
        if avg_confidence < self.confidence_threshold:
            evaluation_result['reasons'].append(
                f'Confidence too low: {avg_confidence:.3f} < {self.confidence_threshold}'
            )
            return evaluation_result

        # Compare with current production model
        current_production = TrainedModel.objects.filter(
            document_type=model.document_type,
            is_production=True,
            status='active'
        ).first()

        if current_production:
            current_evaluations = current_production.evaluations.all()
            if current_evaluations.exists():
                current_avg_accuracy = sum(
                    e.field_matches / max(e.total_fields, 1) for e in current_evaluations
                ) / len(current_evaluations)

                evaluation_result['metrics']['current_production_accuracy'] = current_avg_accuracy
                improvement = avg_accuracy - current_avg_accuracy

                if improvement < self.improvement_threshold:
                    evaluation_result['reasons'].append(
                        f'Insufficient improvement: {improvement:.3f} < {self.improvement_threshold}'
                    )
                    return evaluation_result

                evaluation_result['metrics']['improvement'] = improvement

        evaluation_result['promotable'] = True
        evaluation_result['reasons'].append('Model meets all promotion criteria')

        return evaluation_result


class ABTestManager:
    """Manage A/B testing between model versions"""

    def __init__(self):
        self.active_tests = {}

    def start_ab_test(
        self,
        model_a: TrainedModel,
        model_b: TrainedModel,
        traffic_split: float = 0.5,
        duration_days: int = 7
    ) -> str:
        """Start A/B test between two models"""
        test_id = f"ab_test_{model_a.id}_{model_b.id}_{int(datetime.now().timestamp())}"

        test_config = {
            'test_id': test_id,
            'model_a': model_a,
            'model_b': model_b,
            'traffic_split': traffic_split,
            'start_time': datetime.now(),
            'end_time': datetime.now() + timedelta(days=duration_days),
            'model_a_requests': 0,
            'model_b_requests': 0,
            'model_a_success': 0,
            'model_b_success': 0,
            'status': 'active'
        }

        self.active_tests[test_id] = test_config
        logger.info(f"Started A/B test {test_id}")

        return test_id

    def get_model_for_request(self, doc_type: str, user_id: str = None) -> TrainedModel:
        """Get model for request based on A/B testing"""
        # Check for active A/B tests for this document type
        doc_type_obj = DocumentType.objects.get(name=doc_type)

        for test_id, test_config in self.active_tests.items():
            if (test_config['status'] == 'active' and
                test_config['model_a'].document_type == doc_type_obj and
                datetime.now() < test_config['end_time']):

                # Simple hash-based assignment for consistent user experience
                if user_id:
                    import hashlib
                    hash_value = int(hashlib.md5(f"{user_id}_{test_id}".encode()).hexdigest(), 16)
                    use_model_b = (hash_value % 100) < (test_config['traffic_split'] * 100)
                else:
                    import random
                    use_model_b = random.random() < test_config['traffic_split']

                if use_model_b:
                    test_config['model_b_requests'] += 1
                    return test_config['model_b']
                else:
                    test_config['model_a_requests'] += 1
                    return test_config['model_a']

        # No active test, return production model
        return TrainedModel.objects.filter(
            document_type=doc_type_obj,
            is_production=True,
            status='active'
        ).first()

    def record_result(self, test_id: str, model_id: str, success: bool):
        """Record result for A/B test"""
        if test_id in self.active_tests:
            test_config = self.active_tests[test_id]

            if str(test_config['model_a'].id) == model_id:
                if success:
                    test_config['model_a_success'] += 1
            elif str(test_config['model_b'].id) == model_id:
                if success:
                    test_config['model_b_success'] += 1

    def get_test_results(self, test_id: str) -> Dict:
        """Get A/B test results"""
        if test_id not in self.active_tests:
            return {'error': 'Test not found'}

        test_config = self.active_tests[test_id]

        model_a_success_rate = (
            test_config['model_a_success'] / max(test_config['model_a_requests'], 1)
        )
        model_b_success_rate = (
            test_config['model_b_success'] / max(test_config['model_b_requests'], 1)
        )

        return {
            'test_id': test_id,
            'status': test_config['status'],
            'start_time': test_config['start_time'],
            'end_time': test_config['end_time'],
            'model_a': {
                'id': str(test_config['model_a'].id),
                'version': test_config['model_a'].version,
                'requests': test_config['model_a_requests'],
                'successes': test_config['model_a_success'],
                'success_rate': model_a_success_rate
            },
            'model_b': {
                'id': str(test_config['model_b'].id),
                'version': test_config['model_b'].version,
                'requests': test_config['model_b_requests'],
                'successes': test_config['model_b_success'],
                'success_rate': model_b_success_rate
            },
            'winner': 'model_a' if model_a_success_rate > model_b_success_rate else 'model_b'
        }


class ModelManager:
    """Comprehensive model management system"""

    def __init__(self):
        self.promotion_criteria = ModelPromotionCriteria()
        self.ab_test_manager = ABTestManager()

    def auto_promote_models(self) -> List[Dict]:
        """Automatically promote models that meet criteria"""
        promotion_results = []

        # Check all models that are not currently in production
        candidate_models = TrainedModel.objects.filter(
            status__in=['testing', 'inactive'],
            training_job__status='completed'
        ).select_related('document_type', 'training_job')

        for model in candidate_models:
            try:
                evaluation = self.promotion_criteria.evaluate_model(model)

                if evaluation['promotable']:
                    # Promote model
                    with transaction.atomic():
                        # Demote current production model
                        TrainedModel.objects.filter(
                            document_type=model.document_type,
                            is_production=True
                        ).update(is_production=False, status='inactive')

                        # Promote new model
                        model.is_production = True
                        model.status = 'active'
                        model.promoted_at = timezone.now()
                        model.save()

                    promotion_results.append({
                        'model_id': str(model.id),
                        'version': model.version,
                        'document_type': model.document_type.name,
                        'action': 'promoted',
                        'metrics': evaluation['metrics']
                    })

                    logger.info(f"Auto-promoted model {model.id} for {model.document_type.name}")

                else:
                    promotion_results.append({
                        'model_id': str(model.id),
                        'version': model.version,
                        'document_type': model.document_type.name,
                        'action': 'not_promoted',
                        'reasons': evaluation['reasons'],
                        'metrics': evaluation['metrics']
                    })

            except Exception as e:
                logger.error(f"Error evaluating model {model.id}: {str(e)}")
                promotion_results.append({
                    'model_id': str(model.id),
                    'action': 'error',
                    'error': str(e)
                })

        return promotion_results

    def create_challenger_test(
        self,
        document_type: str,
        challenger_model_id: str,
        traffic_split: float = 0.1,
        duration_days: int = 7
    ) -> Dict:
        """Create a challenger test for a new model"""
        try:
            doc_type_obj = DocumentType.objects.get(name=document_type)

            # Get current production model
            production_model = TrainedModel.objects.filter(
                document_type=doc_type_obj,
                is_production=True,
                status='active'
            ).first()

            if not production_model:
                return {'error': 'No production model found for document type'}

            # Get challenger model
            challenger_model = TrainedModel.objects.get(id=challenger_model_id)

            if challenger_model.document_type != doc_type_obj:
                return {'error': 'Challenger model document type mismatch'}

            # Start A/B test
            test_id = self.ab_test_manager.start_ab_test(
                production_model,
                challenger_model,
                traffic_split,
                duration_days
            )

            return {
                'test_id': test_id,
                'production_model': {
                    'id': str(production_model.id),
                    'version': production_model.version
                },
                'challenger_model': {
                    'id': str(challenger_model.id),
                    'version': challenger_model.version
                },
                'traffic_split': traffic_split,
                'duration_days': duration_days
            }

        except Exception as e:
            logger.error(f"Error creating challenger test: {str(e)}")
            return {'error': str(e)}

    def get_model_for_inference(self, doc_type: str, user_id: str = None) -> TrainedModel:
        """Get the appropriate model for inference (considering A/B tests)"""
        return self.ab_test_manager.get_model_for_request(doc_type, user_id)

    def cleanup_expired_tests(self):
        """Clean up expired A/B tests"""
        current_time = datetime.now()

        for test_id, test_config in list(self.ab_test_manager.active_tests.items()):
            if current_time > test_config['end_time'] and test_config['status'] == 'active':
                test_config['status'] = 'completed'

                # Log final results
                results = self.ab_test_manager.get_test_results(test_id)
                logger.info(f"A/B test {test_id} completed: {results}")

    def get_model_health(self) -> Dict:
        """Get overall model health status"""
        document_types = DocumentType.objects.all()
        health_status = {
            'overall_status': 'healthy',
            'document_types': {},
            'total_models': TrainedModel.objects.count(),
            'production_models': TrainedModel.objects.filter(is_production=True).count(),
            'active_ab_tests': len([t for t in self.ab_test_manager.active_tests.values() if t['status'] == 'active'])
        }

        for doc_type in document_types:
            production_model = TrainedModel.objects.filter(
                document_type=doc_type,
                is_production=True,
                status='active'
            ).first()

            health_status['document_types'][doc_type.name] = {
                'has_production_model': production_model is not None,
                'model_version': production_model.version if production_model else None,
                'last_inference': production_model.last_used_at.isoformat() if production_model and production_model.last_used_at else None,
                'inference_count': production_model.inference_count if production_model else 0
            }

            if not production_model:
                health_status['overall_status'] = 'degraded'

        return health_status


# Global model manager instance
model_manager = ModelManager()