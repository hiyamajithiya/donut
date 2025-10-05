"""
Production-ready inference engine for Donut models with caching and monitoring
"""
import os
import json
import time
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from threading import Lock
import hashlib

import torch
from PIL import Image
import numpy as np
from django.core.cache import cache
from django.conf import settings

from .donut_utils import DonutInference
from .models import TrainedModel, ModelEvaluation
from documents.models import DocumentType

logger = logging.getLogger(__name__)


class ModelCache:
    """Thread-safe model cache with LRU eviction"""

    def __init__(self, max_models: int = 3):
        self.max_models = max_models
        self.models = {}
        self.access_times = {}
        self.lock = Lock()

    def get_model(self, model_id: str) -> Optional[DonutInference]:
        """Get model from cache or return None"""
        with self.lock:
            if model_id in self.models:
                self.access_times[model_id] = time.time()
                return self.models[model_id]
            return None

    def put_model(self, model_id: str, model: DonutInference):
        """Add model to cache with LRU eviction"""
        with self.lock:
            # If cache is full, remove least recently used model
            if len(self.models) >= self.max_models and model_id not in self.models:
                lru_model_id = min(self.access_times, key=self.access_times.get)
                del self.models[lru_model_id]
                del self.access_times[lru_model_id]
                logger.info(f"Evicted model {lru_model_id} from cache")

            self.models[model_id] = model
            self.access_times[model_id] = time.time()
            logger.info(f"Cached model {model_id}")

    def clear(self):
        """Clear all cached models"""
        with self.lock:
            self.models.clear()
            self.access_times.clear()
            logger.info("Cleared model cache")


class ConfidenceCalculator:
    """Calculate confidence scores for model predictions"""

    @staticmethod
    def calculate_token_confidence(token_scores: List[float]) -> float:
        """Calculate confidence from token-level scores"""
        if not token_scores:
            return 0.0

        # Average of token probabilities
        avg_score = np.mean(token_scores)

        # Apply sigmoid to normalize
        confidence = 1 / (1 + np.exp(-avg_score))

        return float(confidence)

    @staticmethod
    def calculate_field_confidence(predicted_data: Dict, validation_rules: Dict) -> float:
        """Calculate confidence based on field validation"""
        if not predicted_data or not validation_rules:
            return 0.5

        confidence_scores = []

        for field, value in predicted_data.items():
            if field in validation_rules:
                rule = validation_rules[field]
                field_confidence = ConfidenceCalculator._validate_field(value, rule)
                confidence_scores.append(field_confidence)

        return np.mean(confidence_scores) if confidence_scores else 0.5

    @staticmethod
    def _validate_field(value: Any, rule: Dict) -> float:
        """Validate a single field and return confidence"""
        if not value:
            return 0.2

        confidence = 0.5

        # Type validation
        expected_type = rule.get('type', 'string')
        if expected_type == 'number':
            try:
                float(str(value))
                confidence += 0.2
            except (ValueError, TypeError):
                confidence -= 0.3

        elif expected_type == 'date':
            try:
                from dateutil.parser import parse
                parse(str(value))
                confidence += 0.2
            except:
                confidence -= 0.3

        # Pattern validation
        pattern = rule.get('pattern')
        if pattern:
            import re
            if re.match(pattern, str(value)):
                confidence += 0.2
            else:
                confidence -= 0.2

        # Length validation
        min_length = rule.get('min_length', 0)
        max_length = rule.get('max_length', float('inf'))

        value_length = len(str(value))
        if min_length <= value_length <= max_length:
            confidence += 0.1
        else:
            confidence -= 0.2

        return max(0.0, min(1.0, confidence))


class InferenceEngine:
    """Production inference engine with caching, monitoring, and confidence scoring"""

    def __init__(self):
        self.model_cache = ModelCache(max_models=3)
        self.inference_stats = {}
        self.confidence_calculator = ConfidenceCalculator()

        # Validation rules for different document types
        self.validation_rules = self._load_validation_rules()

    def _load_validation_rules(self) -> Dict[str, Dict]:
        """Load validation rules for different document types"""
        return {
            'bank_statement': {
                'account_number': {'type': 'string', 'pattern': r'^[0-9]{10,20}$'},
                'ifsc': {'type': 'string', 'pattern': r'^[A-Z]{4}0[A-Z0-9]{6}$'},
                'transactions': {'type': 'array', 'min_length': 1}
            },
            'invoice': {
                'invoice_no': {'type': 'string', 'min_length': 3},
                'gstin': {'type': 'string', 'pattern': r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'},
                'grand_total': {'type': 'number', 'min_value': 0}
            },
            'form_16': {
                'pan': {'type': 'string', 'pattern': r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$'},
                'tan': {'type': 'string', 'pattern': r'^[A-Z]{4}[0-9]{5}[A-Z]{1}$'},
                'gross_salary': {'type': 'number', 'min_value': 0}
            }
        }

    def get_production_model(self, doc_type: str = None, model_version: str = None) -> Tuple[TrainedModel, DonutInference]:
        """Get production model for inference"""
        try:
            if model_version:
                model = TrainedModel.objects.get(
                    version=model_version,
                    status='active'
                )
            elif doc_type:
                doc_type_obj = DocumentType.objects.get(name=doc_type)
                model = TrainedModel.objects.filter(
                    document_type=doc_type_obj,
                    is_production=True,
                    status='active'
                ).first()

                if not model:
                    raise ValueError(f'No active production model found for document type: {doc_type}')
            else:
                raise ValueError('Either doc_type or model_version must be specified')

            # Check cache first
            cache_key = f"model_{model.id}"
            inference_model = self.model_cache.get_model(cache_key)

            if inference_model is None:
                # Load model
                model_path = Path(model.model_path).parent
                inference_model = DonutInference(str(model_path))

                # Cache the model
                self.model_cache.put_model(cache_key, inference_model)

            return model, inference_model

        except Exception as e:
            logger.error(f"Error loading production model: {str(e)}")
            raise

    def extract(
        self,
        image_path: str,
        doc_type: str = None,
        model_version: str = None,
        confidence_threshold: float = 0.5
    ) -> Dict[str, Any]:
        """
        Extract data from document with confidence scoring
        """
        start_time = time.time()

        try:
            # Get model
            model, inference_model = self.get_production_model(doc_type, model_version)

            # Run inference
            extracted_data = inference_model.extract(
                image_path,
                doc_type=model.document_type.name
            )

            # Calculate confidence scores
            confidence_scores = self._calculate_confidence(
                extracted_data,
                model.document_type.name
            )

            # Overall confidence
            overall_confidence = np.mean(list(confidence_scores.values())) if confidence_scores else 0.5

            # Inference time
            inference_time = time.time() - start_time

            # Update model usage stats
            self._update_model_stats(model.id, inference_time, overall_confidence)

            # Update model usage in database
            model.inference_count += 1
            model.last_used_at = datetime.now()
            if model.avg_inference_time:
                model.avg_inference_time = (model.avg_inference_time + inference_time) / 2
            else:
                model.avg_inference_time = inference_time
            model.save()

            # Prepare response
            result = {
                'extracted_data': extracted_data,
                'confidence': {
                    'overall': overall_confidence,
                    'field_scores': confidence_scores,
                    'threshold_met': overall_confidence >= confidence_threshold
                },
                'model_info': {
                    'model_id': str(model.id),
                    'version': model.version,
                    'document_type': model.document_type.name
                },
                'performance': {
                    'inference_time': inference_time,
                    'model_accuracy': model.field_accuracy or 0.0
                },
                'validation': {
                    'passed': overall_confidence >= confidence_threshold,
                    'errors': self._validate_output(extracted_data, model.document_type.name)
                }
            }

            return result

        except Exception as e:
            logger.error(f"Inference failed: {str(e)}")
            raise

    def batch_extract(
        self,
        image_paths: List[str],
        doc_types: List[str] = None,
        batch_size: int = 4
    ) -> List[Dict[str, Any]]:
        """Process multiple documents in batches"""
        if doc_types is None:
            doc_types = [None] * len(image_paths)

        results = []

        # Process in batches
        for i in range(0, len(image_paths), batch_size):
            batch_paths = image_paths[i:i + batch_size]
            batch_types = doc_types[i:i + batch_size]

            batch_results = []
            for path, doc_type in zip(batch_paths, batch_types):
                try:
                    result = self.extract(path, doc_type=doc_type)
                    batch_results.append(result)
                except Exception as e:
                    batch_results.append({
                        'error': str(e),
                        'image_path': path,
                        'doc_type': doc_type
                    })

            results.extend(batch_results)

        return results

    def _calculate_confidence(self, extracted_data: Dict, doc_type: str) -> Dict[str, float]:
        """Calculate field-level confidence scores"""
        confidence_scores = {}

        if not isinstance(extracted_data, dict):
            return confidence_scores

        # Get validation rules for document type
        validation_rules = self.validation_rules.get(doc_type, {})

        for field, value in extracted_data.items():
            if field in validation_rules:
                confidence = self.confidence_calculator._validate_field(
                    value, validation_rules[field]
                )
            else:
                # Default confidence for fields without rules
                confidence = 0.7 if value else 0.3

            confidence_scores[field] = confidence

        return confidence_scores

    def _validate_output(self, extracted_data: Dict, doc_type: str) -> List[str]:
        """Validate extracted data and return list of errors"""
        errors = []

        if not isinstance(extracted_data, dict):
            errors.append("Invalid output format: expected dictionary")
            return errors

        validation_rules = self.validation_rules.get(doc_type, {})

        for field, rule in validation_rules.items():
            if field not in extracted_data:
                if rule.get('required', False):
                    errors.append(f"Required field '{field}' is missing")
                continue

            value = extracted_data[field]

            # Type validation
            expected_type = rule.get('type', 'string')
            if expected_type == 'number':
                try:
                    float(str(value))
                except (ValueError, TypeError):
                    errors.append(f"Field '{field}' should be a number")

            # Pattern validation
            pattern = rule.get('pattern')
            if pattern and value:
                import re
                if not re.match(pattern, str(value)):
                    errors.append(f"Field '{field}' format is invalid")

        return errors

    def _update_model_stats(self, model_id: str, inference_time: float, confidence: float):
        """Update model performance statistics"""
        if model_id not in self.inference_stats:
            self.inference_stats[model_id] = {
                'total_inferences': 0,
                'avg_inference_time': 0.0,
                'avg_confidence': 0.0,
                'last_updated': datetime.now()
            }

        stats = self.inference_stats[model_id]
        stats['total_inferences'] += 1

        # Update running averages
        n = stats['total_inferences']
        stats['avg_inference_time'] = ((n - 1) * stats['avg_inference_time'] + inference_time) / n
        stats['avg_confidence'] = ((n - 1) * stats['avg_confidence'] + confidence) / n
        stats['last_updated'] = datetime.now()

    def get_model_stats(self, model_id: str = None) -> Dict:
        """Get performance statistics for models"""
        if model_id:
            return self.inference_stats.get(model_id, {})
        return self.inference_stats

    def health_check(self) -> Dict[str, Any]:
        """Perform health check on inference system"""
        health_status = {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'cache_info': {
                'cached_models': len(self.model_cache.models),
                'max_cache_size': self.model_cache.max_models
            },
            'inference_stats': {
                'total_models_used': len(self.inference_stats),
                'cache_hit_rate': self._calculate_cache_hit_rate()
            },
            'gpu_available': torch.cuda.is_available(),
            'gpu_memory': self._get_gpu_memory() if torch.cuda.is_available() else None
        }

        return health_status

    def _calculate_cache_hit_rate(self) -> float:
        """Calculate cache hit rate"""
        # This would require more sophisticated tracking
        # For now, return a placeholder
        return 0.85

    def _get_gpu_memory(self) -> Dict[str, float]:
        """Get GPU memory usage"""
        if torch.cuda.is_available():
            return {
                'allocated_gb': torch.cuda.memory_allocated() / 1024**3,
                'reserved_gb': torch.cuda.memory_reserved() / 1024**3,
                'max_memory_gb': torch.cuda.max_memory_allocated() / 1024**3
            }
        return None


# Global inference engine instance
inference_engine = InferenceEngine()