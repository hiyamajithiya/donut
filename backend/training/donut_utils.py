"""
Utilities for Donut model training and inference
"""
import os
import json
import torch
from PIL import Image
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from transformers import (
    DonutProcessor,
    VisionEncoderDecoderModel,
    VisionEncoderDecoderConfig
)
import logging


def load_image_from_file(file_path: str):
    """Load image from file, converting PDF if necessary"""
    from pathlib import Path
    from pdf2image import convert_from_path
    
    file_ext = Path(file_path).suffix.lower()
    
    if file_ext == '.pdf':
        # Convert first page of PDF to image at 200 DPI for better quality
        # Explicitly specify poppler path for Celery environment
        images = convert_from_path(
	    file_path, 
	    first_page=1, 
	    last_page=1, 
	    dpi=200,
	    poppler_path='/usr/bin'
        )
        image = images[0].convert('RGB')
    else:
        # Regular image file
        image = Image.open(file_path).convert('RGB')
    
    return image

logger = logging.getLogger(__name__)


class DonutDataProcessor:
    """Process documents for Donut training"""

    def __init__(self, processor: DonutProcessor, max_length: int = 768):
        self.processor = processor
        self.max_length = max_length
        self.decoder_start_token_id = self.processor.tokenizer.convert_tokens_to_ids(['<s>'])[0]

    def process_document(self, image_path: str, ground_truth: Dict) -> Dict:
        """Process a single document for training"""
        try:
            # Load and process image
            image = load_image_from_file(image_path)

            # Create task prompt based on document type
            task_prompt = f"<s_doctype>{ground_truth.get('doc_type', 'document')}</s_doctype>"

            # Format ground truth as JSON string
            gt_json = json.dumps(ground_truth, ensure_ascii=False)

            # Combine prompt and ground truth
            decoder_input = task_prompt + gt_json + self.processor.tokenizer.eos_token

            # Process image
            pixel_values = self.processor(image, return_tensors="pt").pixel_values

            # Tokenize text
            decoder_input_ids = self.processor.tokenizer(
                decoder_input,
                add_special_tokens=False,
                max_length=self.max_length,
                padding="max_length",
                truncation=True,
                return_tensors="pt"
            ).input_ids

            # Create labels (shift decoder_input_ids for training)
            labels = decoder_input_ids.clone()
            labels[labels == self.processor.tokenizer.pad_token_id] = -100

            return {
                'pixel_values': pixel_values.squeeze(),
                'decoder_input_ids': decoder_input_ids.squeeze(),
                'labels': labels.squeeze()
            }

        except Exception as e:
            logger.error(f"Error processing document {image_path}: {str(e)}")
            raise


class DonutTrainer:
    """Custom trainer for Donut model"""

    def __init__(
        self,
        model_name: str = "naver-clova-ix/donut-base",
        output_dir: str = "models",
        device: str = None
    ):
        self.model_name = model_name
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Set device
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)

        # Initialize model and processor
        self.processor = None
        self.model = None
        self.config = None

    def initialize_model(self, num_labels: Optional[int] = None):
        """Initialize or load model and processor"""
        logger.info(f"Initializing model from {self.model_name}")

        # Load processor
        self.processor = DonutProcessor.from_pretrained(self.model_name)

        # Load model
        self.model = VisionEncoderDecoderModel.from_pretrained(self.model_name)

        # Move model to device
        self.model = self.model.to(self.device)

        # Set special tokens
        self.model.config.pad_token_id = self.processor.tokenizer.pad_token_id
        self.model.config.decoder_start_token_id = self.processor.tokenizer.convert_tokens_to_ids(['<s>'])[0]

        logger.info(f"Model initialized on {self.device}")

    def add_special_tokens(self, special_tokens: List[str]):
        """Add special tokens for document types"""
        new_tokens = []
        for token in special_tokens:
            if token not in self.processor.tokenizer.get_vocab():
                new_tokens.append(token)

        if new_tokens:
            self.processor.tokenizer.add_special_tokens({
                "additional_special_tokens": new_tokens
            })
            self.model.decoder.resize_token_embeddings(len(self.processor.tokenizer))
            logger.info(f"Added {len(new_tokens)} special tokens")

    def prepare_dataset(
        self,
        documents: List[Tuple[str, Dict]],
        split_ratios: Tuple[float, float, float] = (0.8, 0.1, 0.1)
    ) -> Tuple[List, List, List]:
        """
        Prepare dataset splits
        Args:
            documents: List of (image_path, ground_truth_dict) tuples
            split_ratios: (train, val, test) ratios
        """
        import random
        random.shuffle(documents)

        total = len(documents)
        train_size = int(total * split_ratios[0])
        val_size = int(total * split_ratios[1])

        train_data = documents[:train_size]
        val_data = documents[train_size:train_size + val_size]
        test_data = documents[train_size + val_size:]

        logger.info(f"Dataset splits - Train: {len(train_data)}, Val: {len(val_data)}, Test: {len(test_data)}")

        return train_data, val_data, test_data

    def save_model(self, version: str, metadata: Optional[Dict] = None):
        """Save model and processor with version"""
        save_path = self.output_dir / f"donut_model_v{version}"
        save_path.mkdir(parents=True, exist_ok=True)

        # Save model
        self.model.save_pretrained(save_path / "model")

        # Save processor
        self.processor.save_pretrained(save_path / "processor")

        # Save metadata
        if metadata:
            with open(save_path / "metadata.json", 'w') as f:
                json.dump(metadata, f, indent=2)

        logger.info(f"Model saved to {save_path}")
        return str(save_path)

    def load_model(self, model_path: str):
        """Load a trained model"""
        model_path = Path(model_path)

        # Load processor
        self.processor = DonutProcessor.from_pretrained(model_path / "processor")

        # Load model
        self.model = VisionEncoderDecoderModel.from_pretrained(model_path / "model")
        self.model = self.model.to(self.device)

        logger.info(f"Model loaded from {model_path}")


class DonutInference:
    """Handle inference with trained Donut models"""

    def __init__(self, model_path: str, device: str = None):
        self.model_path = Path(model_path)

        # Set device
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)

        # Load model and processor
        self.processor = DonutProcessor.from_pretrained(self.model_path / "processor")
        self.model = VisionEncoderDecoderModel.from_pretrained(self.model_path / "model")
        self.model = self.model.to(self.device)
        self.model.eval()

    def extract(
        self,
        image_path: str,
        doc_type: Optional[str] = None,
        max_length: int = 768,
        num_beams: int = 1
    ) -> Dict[str, Any]:
        """
        Extract information from document
        Args:
            image_path: Path to document image
            doc_type: Document type hint
            max_length: Maximum sequence length
            num_beams: Number of beams for beam search
        Returns:
            Extracted JSON data
        """
        try:
            # Load image
            image = load_image_from_file(image_path)

            # Process image
            pixel_values = self.processor(image, return_tensors="pt").pixel_values
            pixel_values = pixel_values.to(self.device)

            # Create task prompt
            task_prompt = f"<s_doctype>{doc_type}</s_doctype>" if doc_type else "<s>"
            decoder_input_ids = self.processor.tokenizer(
                task_prompt,
                add_special_tokens=False,
                return_tensors="pt"
            ).input_ids
            decoder_input_ids = decoder_input_ids.to(self.device)

            # Generate
            with torch.no_grad():
                outputs = self.model.generate(
                    pixel_values,
                    decoder_input_ids=decoder_input_ids,
                    max_length=max_length,
                    num_beams=num_beams,
                    pad_token_id=self.processor.tokenizer.pad_token_id,
                    eos_token_id=self.processor.tokenizer.eos_token_id,
                    use_cache=True,
                    return_dict_in_generate=True,
                )

            # Decode output
            prediction = self.processor.batch_decode(outputs.sequences)[0]

            # Parse JSON from prediction
            prediction = prediction.replace(self.processor.tokenizer.eos_token, "")
            prediction = prediction.replace(self.processor.tokenizer.pad_token, "")

            # Extract JSON part
            if task_prompt in prediction:
                prediction = prediction.replace(task_prompt, "")

            # Try to parse JSON
            try:
                result = json.loads(prediction)
            except json.JSONDecodeError:
                # Return raw text if JSON parsing fails
                result = {"raw_text": prediction}

            return result

        except Exception as e:
            logger.error(f"Error during inference: {str(e)}")
            raise

    def batch_extract(
        self,
        image_paths: List[str],
        doc_types: Optional[List[str]] = None,
        batch_size: int = 4
    ) -> List[Dict[str, Any]]:
        """Extract from multiple documents"""
        results = []

        if doc_types is None:
            doc_types = [None] * len(image_paths)

        for i in range(0, len(image_paths), batch_size):
            batch_paths = image_paths[i:i + batch_size]
            batch_types = doc_types[i:i + batch_size]

            for path, doc_type in zip(batch_paths, batch_types):
                result = self.extract(path, doc_type)
                results.append(result)

        return results


def calculate_metrics(predictions: List[Dict], ground_truths: List[Dict]) -> Dict[str, float]:
    """Calculate evaluation metrics"""
    metrics = {
        'exact_match': 0,
        'field_accuracy': 0,
        'total_fields': 0,
        'correct_fields': 0
    }

    for pred, gt in zip(predictions, ground_truths):
        # Exact match
        if pred == gt:
            metrics['exact_match'] += 1

        # Field-level accuracy
        gt_fields = set(gt.keys()) if isinstance(gt, dict) else set()
        pred_fields = set(pred.keys()) if isinstance(pred, dict) else set()

        all_fields = gt_fields.union(pred_fields)
        metrics['total_fields'] += len(all_fields)

        for field in all_fields:
            if field in gt and field in pred:
                if gt[field] == pred[field]:
                    metrics['correct_fields'] += 1

    # Calculate percentages
    n = len(predictions)
    metrics['exact_match'] = (metrics['exact_match'] / n * 100) if n > 0 else 0
    metrics['field_accuracy'] = (metrics['correct_fields'] / metrics['total_fields'] * 100) if metrics['total_fields'] > 0 else 0

    return metrics
