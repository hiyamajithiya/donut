"""
Training script for Donut model
"""
import os
import json
import torch
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
from torch.utils.data import Dataset, DataLoader
from transformers import (
    VisionEncoderDecoderModel,
    DonutProcessor,
    Seq2SeqTrainer,
    Seq2SeqTrainingArguments,
    default_data_collator
)
from tqdm import tqdm
import numpy as np

from .donut_utils import DonutDataProcessor, DonutTrainer, calculate_metrics
from .models import TrainingJob, TrainingProgress, TrainedModel
from documents.models import Document, DocumentLabel

logger = logging.getLogger(__name__)


class DonutDataset(Dataset):
    """Dataset for Donut training"""

    def __init__(
        self,
        data_list: List[Dict],
        processor: DonutProcessor,
        max_length: int = 768,
        split: str = "train"
    ):
        self.data_list = data_list
        self.processor = processor
        self.max_length = max_length
        self.split = split
        self.data_processor = DonutDataProcessor(processor, max_length)

    def __len__(self):
        return len(self.data_list)

    def __getitem__(self, idx):
        """Get a single item from dataset"""
        item = self.data_list[idx]

        try:
            # Process document
            processed = self.data_processor.process_document(
                item['image_path'],
                item['ground_truth']
            )
            return processed
        except Exception as e:
            logger.error(f"Error processing item {idx}: {str(e)}")
            # Return a dummy item to prevent training crash
            return {
                'pixel_values': torch.zeros(3, 224, 224),
                'decoder_input_ids': torch.zeros(self.max_length, dtype=torch.long),
                'labels': torch.full((self.max_length,), -100, dtype=torch.long)
            }


class TrainingCallback:
    """Callback for updating training progress in database"""

    def __init__(self, job_id: str):
        self.job_id = job_id
        self.job = None
        self.update_interval = 10  # Update every 10 steps

    def on_train_begin(self):
        """Called at the beginning of training"""
        try:
            self.job = TrainingJob.objects.get(id=self.job_id)
            self.job.status = 'training'
            self.job.started_at = datetime.now()
            self.job.save()
        except TrainingJob.DoesNotExist:
            logger.error(f"Training job {self.job_id} not found")

    def on_step_end(self, step: int, epoch: int, loss: float, learning_rate: float):
        """Called at the end of each training step"""
        if step % self.update_interval == 0 and self.job:
            # Update job progress
            self.job.current_step = step
            self.job.current_epoch = epoch
            self.job.train_loss = loss
            self.job.save()

            # Create progress entry
            TrainingProgress.objects.create(
                training_job=self.job,
                epoch=epoch,
                step=step,
                loss=loss,
                learning_rate=learning_rate,
                message=f"Epoch {epoch}, Step {step}: Loss={loss:.4f}"
            )

    def on_epoch_end(self, epoch: int, val_loss: Optional[float] = None):
        """Called at the end of each epoch"""
        if self.job:
            self.job.current_epoch = epoch

            if val_loss is not None:
                self.job.val_loss = val_loss
                if self.job.best_val_loss is None or val_loss < self.job.best_val_loss:
                    self.job.best_val_loss = val_loss

            self.job.save()

    def on_train_end(self, success: bool = True, error_message: Optional[str] = None):
        """Called at the end of training"""
        if self.job:
            if success:
                self.job.status = 'evaluating'
            else:
                self.job.status = 'failed'
                self.job.error_message = error_message or "Training failed"

            self.job.completed_at = datetime.now()
            self.job.save()


def prepare_training_data(dataset_id: str) -> tuple:
    """
    Prepare training data from database
    Returns: (train_list, val_list, test_list)
    """
    from training.models import TrainingDataset

    try:
        dataset = TrainingDataset.objects.get(id=dataset_id)
        documents = Document.objects.filter(
            document_type=dataset.document_type,
            status='labeled'
        ).select_related('label')

        data_list = []
        for doc in documents:
            if hasattr(doc, 'label') and doc.label.label_data:
                data_list.append({
                    'image_path': doc.file.path,
                    'ground_truth': doc.label.label_data
                })

        # Split data
        total = len(data_list)
        train_size = int(total * dataset.train_split)
        val_size = int(total * dataset.val_split)

        train_data = data_list[:train_size]
        val_data = data_list[train_size:train_size + val_size]
        test_data = data_list[train_size + val_size:]

        logger.info(f"Prepared dataset - Train: {len(train_data)}, Val: {len(val_data)}, Test: {len(test_data)}")

        return train_data, val_data, test_data

    except Exception as e:
        logger.error(f"Error preparing training data: {str(e)}")
        raise


def train_donut_model(job_id: str):
    """
    Main training function
    Args:
        job_id: Training job ID from database
    """
    callback = TrainingCallback(job_id)

    try:
        # Get training job
        job = TrainingJob.objects.get(id=job_id)
        callback.on_train_begin()

        # Initialize trainer
        trainer = DonutTrainer(
            model_name=job.base_model,
            output_dir="models"
        )
        trainer.initialize_model()

        # Add special tokens for document types
        special_tokens = [
            "<s_doctype>", "</s_doctype>",
            "bank_statement", "invoice", "expense_voucher",
            "form_16", "form_16a", "form_26as",
            "ais_tis", "balance_sheet", "profit_loss",
            "tds_form", "gst_form"
        ]
        trainer.add_special_tokens(special_tokens)

        # Prepare data
        train_data, val_data, test_data = prepare_training_data(job.dataset.id)

        # Create datasets
        train_dataset = DonutDataset(
            train_data,
            trainer.processor,
            max_length=768,  # Text sequence length
            split="train"
        )

        val_dataset = DonutDataset(
            val_data,
            trainer.processor,
            max_length=768,  # Text sequence length
            split="validation"
        ) if val_data else None

        # Training arguments
        training_args = Seq2SeqTrainingArguments(
            output_dir=f"models/training_{job_id}",
            num_train_epochs=job.epochs,
            per_device_train_batch_size=job.batch_size,
            per_device_eval_batch_size=job.batch_size,
            gradient_accumulation_steps=job.gradient_accumulation_steps,
            learning_rate=job.learning_rate,
            weight_decay=job.weight_decay,
            logging_steps=10,
            save_steps=500,
            eval_strategy="epoch" if val_dataset else "no",
            save_strategy="epoch",
            save_total_limit=3,
            load_best_model_at_end=True if val_dataset else False,
            metric_for_best_model="loss",
            greater_is_better=False,
            remove_unused_columns=False,
            fp16=torch.cuda.is_available(),
            report_to="none",
        )

        # Custom trainer with callbacks
        class CustomTrainer(Seq2SeqTrainer):
            def __init__(self, *args, callback=None, **kwargs):
                super().__init__(*args, **kwargs)
                self.callback = callback
                self.current_epoch = 0

            def compute_loss(self, model, inputs, return_outputs=False, **kwargs):
                loss = super().compute_loss(model, inputs, return_outputs)

                # Update callback
                if self.callback and self.state.global_step % 10 == 0:
                    self.callback.on_step_end(
                        self.state.global_step,
                        self.current_epoch,
                        loss.item() if hasattr(loss, 'item') else loss,
                        self.args.learning_rate
                    )

                return loss

            def evaluation_loop(self, *args, **kwargs):
                output = super().evaluation_loop(*args, **kwargs)

                # Update callback with validation loss
                if self.callback and 'eval_loss' in output.metrics:
                    self.callback.on_epoch_end(
                        self.current_epoch,
                        output.metrics['eval_loss']
                    )

                return output

        # Create trainer
        seq2seq_trainer = CustomTrainer(
            model=trainer.model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=val_dataset,
            data_collator=default_data_collator,
            tokenizer=trainer.processor.tokenizer,
            callback=callback
        )

        # Train
        logger.info("Starting training...")
        seq2seq_trainer.train()

        # Save model
        version = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_path = trainer.save_model(
            version=version,
            metadata={
                'job_id': str(job_id),
                'dataset_id': str(job.dataset.id),
                'epochs': job.epochs,
                'batch_size': job.batch_size,
                'learning_rate': job.learning_rate,
                'train_samples': len(train_data),
                'val_samples': len(val_data) if val_data else 0,
                'test_samples': len(test_data) if test_data else 0
            }
        )

        # Update job with model path
        job.model_path = model_path
        job.processor_path = model_path
        job.status = 'completed'
        job.save()

        # Create trained model entry
        trained_model = TrainedModel.objects.create(
            training_job=job,
            version=version,
            name=f"{job.dataset.document_type.display_name} Model v{version}",
            description=f"Trained for {job.epochs} epochs on {len(train_data)} samples",
            document_type=job.dataset.document_type,
            model_path=os.path.join(model_path, "model"),
            processor_path=os.path.join(model_path, "processor"),
            status='testing'
        )

        # Run evaluation if test data exists
        if test_data:
            evaluate_model(trained_model, test_data)

        callback.on_train_end(success=True)
        logger.info(f"Training completed successfully. Model saved to {model_path}")

    except Exception as e:
        logger.error(f"Training failed: {str(e)}")
        callback.on_train_end(success=False, error_message=str(e))
        raise


def evaluate_model(model: TrainedModel, test_data: List[Dict]):
    """Evaluate trained model on test data"""
    from .donut_utils import DonutInference

    try:
        # Initialize inference
        inference = DonutInference(
            model_path=os.path.dirname(model.model_path)
        )

        predictions = []
        ground_truths = []

        # Run inference on test data
        for item in tqdm(test_data, desc="Evaluating"):
            # Extract
            pred = inference.extract(
                item['image_path'],
                doc_type=item['ground_truth'].get('doc_type')
            )
            predictions.append(pred)
            ground_truths.append(item['ground_truth'])

        # Calculate metrics
        metrics = calculate_metrics(predictions, ground_truths)

        # Update model with metrics
        model.json_exact_match = metrics['exact_match']
        model.field_accuracy = metrics['field_accuracy']
        model.save()

        logger.info(f"Evaluation completed - Exact match: {metrics['exact_match']:.2f}%, Field accuracy: {metrics['field_accuracy']:.2f}%")

    except Exception as e:
        logger.error(f"Evaluation failed: {str(e)}")
        raise
