from rest_framework import serializers
from .models import (
    TrainingDataset, TrainingJob, TrainedModel,
    TrainingProgress, ModelEvaluation, Feedback
)
from documents.serializers import DocumentSerializer


class TrainingDatasetSerializer(serializers.ModelSerializer):
    document_type_display = serializers.CharField(source='document_type.display_name', read_only=True)

    class Meta:
        model = TrainingDataset
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class TrainingProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingProgress
        fields = ['epoch', 'step', 'loss', 'learning_rate', 'message', 'created_at']


class TrainingJobSerializer(serializers.ModelSerializer):
    dataset_name = serializers.CharField(source='dataset.name', read_only=True)
    progress_updates = TrainingProgressSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = TrainingJob
        fields = '__all__'
        read_only_fields = [
            'id', 'current_epoch', 'current_step', 'total_steps',
            'train_loss', 'val_loss', 'best_val_loss',
            'started_at', 'completed_at', 'estimated_completion',
            'model_path', 'processor_path', 'training_logs', 'error_message',
            'created_at', 'updated_at'
        ]


class TrainingJobCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingJob
        fields = [
            'dataset', 'base_model', 'epochs', 'batch_size',
            'learning_rate', 'weight_decay', 'gradient_accumulation_steps',
            'image_size'
        ]

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class TrainedModelSerializer(serializers.ModelSerializer):
    document_type_display = serializers.CharField(source='document_type.display_name', read_only=True)
    training_job_id = serializers.CharField(source='training_job.id', read_only=True)

    class Meta:
        model = TrainedModel
        fields = '__all__'
        read_only_fields = [
            'id', 'inference_count', 'last_used_at',
            'created_at', 'updated_at'
        ]


class ModelEvaluationSerializer(serializers.ModelSerializer):
    document = DocumentSerializer(read_only=True)
    model_name = serializers.CharField(source='model.name', read_only=True)

    class Meta:
        model = ModelEvaluation
        fields = '__all__'
        read_only_fields = ['created_at']


class FeedbackSerializer(serializers.ModelSerializer):
    document_filename = serializers.CharField(source='document.original_filename', read_only=True)
    model_name = serializers.CharField(source='model.name', read_only=True)

    class Meta:
        model = Feedback
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ExtractRequestSerializer(serializers.Serializer):
    file = serializers.FileField()
    document_type = serializers.CharField(required=False)
    model_version = serializers.CharField(required=False)


class ExtractResponseSerializer(serializers.Serializer):
    extracted_data = serializers.JSONField()
    confidence = serializers.FloatField()
    model_version = serializers.CharField()
    inference_time = serializers.FloatField()