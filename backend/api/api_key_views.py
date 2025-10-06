from rest_framework import views, status
from rest_framework.response import Response
from django.utils import timezone
from django.contrib.auth import get_user_model
from training.models import APIKey, TrainedModel
from documents.models import Document
from datetime import datetime, timedelta
import json

User = get_user_model()


class APIKeyManagementView(views.APIView):
    """Manage API keys - create, list, revoke"""
    permission_classes = []  # For development

    def get(self, request):
        """List all API keys for the user"""
        try:
            # Get or create default user for development
            user = User.objects.first()
            if not user:
                user = User.objects.create_user(
                    username='dev',
                    email='dev@example.com',
                    password='dev123'
                )

            api_keys = APIKey.objects.filter(user=user)

            keys_data = []
            for key in api_keys:
                keys_data.append({
                    'id': str(key.id),
                    'name': key.name,
                    'key_prefix': key.key_prefix,
                    'is_active': key.is_active,
                    'rate_limit': key.rate_limit,
                    'total_requests': key.total_requests,
                    'last_used_at': key.last_used_at.isoformat() if key.last_used_at else None,
                    'created_at': key.created_at.isoformat(),
                    'expires_at': key.expires_at.isoformat() if key.expires_at else None,
                    'allowed_models_count': key.allowed_models.count()
                })

            return Response({
                'api_keys': keys_data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Failed to fetch API keys: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        """Create a new API key"""
        try:
            # Get or create default user for development
            user = User.objects.first()
            if not user:
                user = User.objects.create_user(
                    username='dev',
                    email='dev@example.com',
                    password='dev123'
                )

            name = request.data.get('name', 'Default API Key')
            rate_limit = request.data.get('rate_limit', 1000)
            expires_in_days = request.data.get('expires_in_days')
            allowed_model_ids = request.data.get('allowed_models', [])

            # Generate the API key
            api_key = APIKey.generate_key()
            key_hash = APIKey.hash_key(api_key)
            key_prefix = api_key[:8]

            # Set expiration date if provided
            expires_at = None
            if expires_in_days:
                expires_at = timezone.now() + timedelta(days=int(expires_in_days))

            # Create API key record
            api_key_obj = APIKey.objects.create(
                user=user,
                name=name,
                key_prefix=key_prefix,
                key_hash=key_hash,
                rate_limit=rate_limit,
                expires_at=expires_at
            )

            # Add allowed models if specified
            if allowed_model_ids:
                models = TrainedModel.objects.filter(id__in=allowed_model_ids)
                api_key_obj.allowed_models.set(models)

            return Response({
                'id': str(api_key_obj.id),
                'api_key': api_key,  # Only returned once!
                'name': api_key_obj.name,
                'key_prefix': api_key_obj.key_prefix,
                'rate_limit': api_key_obj.rate_limit,
                'expires_at': api_key_obj.expires_at.isoformat() if api_key_obj.expires_at else None,
                'created_at': api_key_obj.created_at.isoformat(),
                'message': 'API key created successfully. Save this key securely - it will not be shown again!'
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': f'Failed to create API key: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request):
        """Delete/revoke an API key"""
        try:
            key_id = request.data.get('key_id')
            if not key_id:
                return Response(
                    {'error': 'key_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            api_key = APIKey.objects.get(id=key_id)
            api_key.delete()

            return Response({
                'message': 'API key deleted successfully'
            }, status=status.HTTP_200_OK)

        except APIKey.DoesNotExist:
            return Response(
                {'error': 'API key not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to delete API key: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def patch(self, request):
        """Update API key (activate/deactivate)"""
        try:
            key_id = request.data.get('key_id')
            is_active = request.data.get('is_active')

            if not key_id:
                return Response(
                    {'error': 'key_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            api_key = APIKey.objects.get(id=key_id)

            if is_active is not None:
                api_key.is_active = is_active
                api_key.save()

            return Response({
                'id': str(api_key.id),
                'is_active': api_key.is_active,
                'message': 'API key updated successfully'
            }, status=status.HTTP_200_OK)

        except APIKey.DoesNotExist:
            return Response(
                {'error': 'API key not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to update API key: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ModelInferenceView(views.APIView):
    """Public API endpoint for model inference using API key authentication"""
    permission_classes = []  # Public endpoint, uses API key auth

    def authenticate_api_key(self, request):
        """Authenticate request using API key from header"""
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if not auth_header.startswith('Bearer '):
            return None, 'Missing or invalid Authorization header. Use: Authorization: Bearer <api_key>'

        api_key = auth_header.replace('Bearer ', '').strip()

        if not api_key:
            return None, 'API key is required'

        # Hash the provided key and look it up
        key_hash = APIKey.hash_key(api_key)

        try:
            api_key_obj = APIKey.objects.get(key_hash=key_hash)

            # Check if key is active
            if not api_key_obj.is_active:
                return None, 'API key is inactive'

            # Check if key has expired
            if api_key_obj.expires_at and api_key_obj.expires_at < timezone.now():
                return None, 'API key has expired'

            # Update usage stats
            api_key_obj.total_requests += 1
            api_key_obj.last_used_at = timezone.now()
            api_key_obj.save()

            return api_key_obj, None

        except APIKey.DoesNotExist:
            return None, 'Invalid API key'

    def post(self, request):
        """
        Perform inference on a document using a trained model

        Request body:
        {
            "model_id": "uuid",
            "document": file or base64 encoded string,
            "return_confidence": true/false (optional)
        }
        """
        try:
            # Authenticate using API key
            api_key_obj, error = self.authenticate_api_key(request)
            if error:
                return Response(
                    {'error': error},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Get model ID from request
            model_id = request.data.get('model_id')
            if not model_id:
                return Response(
                    {'error': 'model_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get the trained model
            try:
                model = TrainedModel.objects.get(id=model_id)
            except TrainedModel.DoesNotExist:
                return Response(
                    {'error': 'Model not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Check if API key has access to this model
            allowed_models = api_key_obj.allowed_models.all()
            if allowed_models.exists() and model not in allowed_models:
                return Response(
                    {'error': 'API key does not have access to this model'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Check if model is active
            if model.status != 'active':
                return Response(
                    {'error': f'Model is not active (status: {model.status})'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get document from request
            document = request.FILES.get('document')
            if not document:
                return Response(
                    {'error': 'document file is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # TODO: Implement actual inference using the trained model
            # For now, return mock response
            extracted_data = {
                'document_type': model.document_type.name,
                'model_id': str(model.id),
                'model_name': model.name,
                'extracted_fields': {},
                'confidence_scores': {},
                'inference_time_ms': 250,
                'message': 'This is a mock response. Actual inference will be implemented with model loading.'
            }

            # Update model usage stats
            model.inference_count += 1
            model.last_used_at = timezone.now()
            model.save()

            return Response(extracted_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Inference failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get(self, request):
        """Get available models for inference"""
        try:
            # Authenticate using API key
            api_key_obj, error = self.authenticate_api_key(request)
            if error:
                return Response(
                    {'error': error},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Get allowed models for this API key
            allowed_models = api_key_obj.allowed_models.all()

            # If no specific models are set, return all active models
            if not allowed_models.exists():
                models = TrainedModel.objects.filter(status='active')
            else:
                models = allowed_models.filter(status='active')

            models_data = []
            for model in models:
                models_data.append({
                    'id': str(model.id),
                    'name': model.name,
                    'document_type': model.document_type.display_name,
                    'version': model.version,
                    'field_accuracy': model.field_accuracy,
                    'avg_inference_time': model.avg_inference_time,
                })

            return Response({
                'models': models_data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Failed to fetch models: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
