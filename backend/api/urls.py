from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DocumentTypeViewSet, DocumentViewSet,
    TrainingDatasetViewSet, TrainingJobViewSet,
    TrainedModelViewSet, ExtractView, FeedbackViewSet,
    BatchExtractView, ModelHealthView, ModelStatsView,
    ModelManagementView, ModelAnalyticsView, ModelComparisonView
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
]