#!/usr/bin/env python3
import re

print("Reading training/train.py...")
with open('training/train.py', 'r') as f:
    content = f.read()

# Add the transform function after logger definition
transform_function = '''

def transform_label_format(label_data, document_type):
    """
    Transform UI label format to Donut training format
    Converts from: {"template-0": {"text": "INV-001", "area": {...}}}
    To: {"invoice_number": "INV-001"}
    """
    if not label_data:
        return label_data
    
    # Check if already in correct format
    if not any(k.startswith('template-') for k in label_data.keys()):
        return label_data
    
    # Get field mapping from document type schema
    if not document_type or not hasattr(document_type, 'schema') or not document_type.schema:
        logger.warning("No schema found for document type")
        return label_data
    
    # Create field mapping
    field_map = {field['id']: field['name'].lower().replace(' ', '_') 
                 for field in document_type.schema.get('fields', [])}
    
    # Transform labels
    new_data = {}
    for template_id, field_info in label_data.items():
        if template_id in field_map:
            field_name = field_map[template_id]
            if isinstance(field_info, dict):
                text_value = field_info.get('text', '')
            else:
                text_value = field_info
            new_data[field_name] = text_value
    
    logger.info(f"Transformed {len(label_data)} templates to {len(new_data)} fields")
    return new_data
'''

# Insert after logger definition
if 'def transform_label_format' not in content:
    content = content.replace(
        'logger = logging.getLogger(__name__)',
        'logger = logging.getLogger(__name__)' + transform_function
    )
    print("✓ Added transform_label_format function")
else:
    print("! Function already exists, skipping")

# Update the data_list.append section
old_pattern = r"if hasattr\(doc, 'label'\) and doc\.label\.label_data:\s+data_list\.append\(\{\s+'image_path': doc\.file\.path,\s+'ground_truth': doc\.label\.label_data"

new_code = """if hasattr(doc, 'label') and doc.label.label_data:
                # Transform label format
                transformed_label = transform_label_format(
                    doc.label.label_data,
                    dataset.document_type
                )
                data_list.append({
                    'image_path': doc.file.path,
                    'ground_truth': transformed_label"""

if 'transformed_label' not in content:
    content = re.sub(old_pattern, new_code, content)
    print("✓ Updated data preparation to use transform_label_format")
else:
    print("! Already using transformed_label, skipping")

# Write back
with open('training/train.py', 'w') as f:
    f.write(content)

print("\n✅ train.py updated successfully!")
