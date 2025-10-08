from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DocumentTypeViewSet, DocumentViewSet,
    TrainingDatasetViewSet, TrainingJobViewSet,
    TrainedModelViewSet, ExtractView, FeedbackViewSet,
    BatchExtractView, ModelHealthView, ModelStatsView,
    ModelManagementView, ModelAnalyticsView, ModelComparisonView
)
from .wizard_views import (
    WizardConfigView, WizardDocumentUploadView,
    WizardAnnotationView, WizardTrainingView,
    WizardStatusView, WizardModelsView, WizardTestModelView
)
from .api_key_views import (
    APIKeyManagementView, ModelInferenceView
)

router = DefaultRouter()
router.register(r'document-types', DocumentTypeViewSet)
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'datasets', TrainingDatasetViewSet, basename='dataset')
router.register(r'training-jobs', TrainingJobViewSet, basename='trainingjob')
router.register(r'models', TrainedModelViewSet, basename='model')
router.register(r'feedback', FeedbackViewSet, basename='feedback')

urlpatterns = [
    path('', include(router.urls)),
    path('extract/', ExtractView.as_view(), name='extract'),
    path('extract/batch/', BatchExtractView.as_view(), name='batch-extract'),
    path('models/health/', ModelHealthView.as_view(), name='model-health'),
    path('models/stats/', ModelStatsView.as_view(), name='model-stats'),
    path('models/manage/', ModelManagementView.as_view(), name='model-management'),
    path('models/analytics/', ModelAnalyticsView.as_view(), name='model-analytics'),
    path('models/compare/', ModelComparisonView.as_view(), name='model-comparison'),

    # Wizard endpoints
    path('wizard/config/', WizardConfigView.as_view(), name='wizard-config'),
    path('wizard/upload/', WizardDocumentUploadView.as_view(), name='wizard-upload'),
    path('wizard/annotate/', WizardAnnotationView.as_view(), name='wizard-annotate'),
    path('wizard/train/', WizardTrainingView.as_view(), name='wizard-train'),
    path('wizard/status/', WizardStatusView.as_view(), name='wizard-status'),
    path('wizard/models/', WizardModelsView.as_view(), name='wizard-models'),
    path('wizard/test-model/', WizardTestModelView.as_view(), name='wizard-test-model'),

    # API Key management
    path('api-keys/', APIKeyManagementView.as_view(), name='api-keys'),

    # Public inference endpoint (API key authenticated)
    path('inference/', ModelInferenceView.as_view(), name='model-inference'),
]