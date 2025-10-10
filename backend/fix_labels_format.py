import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'donut_trainer.settings')
django.setup()

from documents.models import Document, DocumentLabel, DocumentType

# Get invoice document type with schema
doc_type = DocumentType.objects.get(name='invoice')
field_map = {field['id']: field['name'].lower().replace(' ', '_') 
             for field in doc_type.schema['fields']}

print(f"Field mapping: {field_map}")

# Update all labels to proper format
labels = DocumentLabel.objects.all()
for label in labels:
    old_data = label.label_data
    new_data = {}
    
    for template_id, field_info in old_data.items():
        if template_id in field_map:
            field_name = field_map[template_id]
            # Extract just the text value
            text_value = field_info.get('text', '')
            new_data[field_name] = text_value
    
    label.label_data = new_data
    label.save()
    print(f"Updated {label.document.original_filename}: {new_data}")

print("\n✅ All labels transformed to proper format!")
