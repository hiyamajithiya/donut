from rest_framework import serializers
from .models import DocumentType, Document, DocumentLabel, DocumentProcessingLog


class DocumentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentType
        fields = '__all__'


class DocumentProcessingLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentProcessingLog
        fields = ['id', 'action', 'message', 'error', 'created_at']


class DocumentLabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentLabel
        fields = [
            'id', 'document', 'label_data', 'is_validated',
            'validation_errors', 'labeled_by', 'time_spent_seconds',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class DocumentSerializer(serializers.ModelSerializer):
    label = DocumentLabelSerializer(read_only=True)
    logs = DocumentProcessingLogSerializer(many=True, read_only=True)
    document_type_display = serializers.CharField(source='document_type.display_name', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'user', 'document_type', 'document_type_display',
            'file', 'file_url', 'original_filename', 'file_size',
            'status', 'page_count', 'extracted_text',
            'label', 'logs', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'page_count', 'extracted_text']

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None


class DocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['file', 'document_type', 'original_filename']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['file_size'] = validated_data['file'].size
        return super().create(validated_data)