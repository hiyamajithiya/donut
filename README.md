# Donut Trainer - No-Code OCR Document Understanding System

A web-based system for training and deploying the Donut (Document Understanding Transformer) model for financial document processing in Chartered Accountant offices.

## Project Structure

```
donut-trainer/
├── backend/               # Django backend
│   ├── donut_trainer/    # Main Django project
│   ├── documents/        # Document management app
│   ├── training/         # Training and model management app
│   ├── api/             # API endpoints
│   └── requirements.txt  # Python dependencies
│
├── frontend/             # React frontend
│   ├── src/             # React source code
│   ├── public/          # Static files
│   └── package.json     # Node dependencies
│
└── models/              # Stored trained models (created on first use)
```

## Features

### Phase 1: Project Setup ✅
- Django backend with REST API
- React TypeScript frontend
- PostgreSQL/SQLite database
- CORS configuration

### Phase 2: Backend Core Models ✅
- Document management models
- Training job models
- Feedback and evaluation models
- REST API endpoints

### Phase 3: Training Engine (In Progress)
- Donut model training pipeline
- Celery task queue for background processing
- Model versioning and storage
- Real-time training progress tracking

### Phase 4: Inference & Extraction
- Production-ready extraction API
- Model promotion system
- Active learning with feedback

### Phase 5: Frontend Wizard UI
- 9-step wizard interface
- Drag-and-drop file uploads
- Side-by-side labeling interface
- Training progress monitoring

### Phase 6: Evaluation & Security
- Metrics dashboard
- Playground for testing
- Security features (encryption, masking)
- Audit logging

## Supported Document Types

- Bank Statements
- Invoices
- Expense Vouchers
- Form 16/16A
- Form 26AS
- AIS/TIS Reports
- Balance Sheets
- Profit & Loss Statements
- TDS/GST Forms

## Tech Stack

### Backend
- Python 3.10+
- Django 4.x
- Django REST Framework
- PyTorch with CUDA
- Hugging Face Transformers
- Celery + Redis

### Frontend
- React 18+
- TypeScript
- Material-UI
- Axios
- React Router

## Quick Start

### Backend Setup

```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
# On Unix: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- Django Admin: http://localhost:8000/admin

## API Endpoints

- `/api/document-types/` - Document type definitions
- `/api/documents/` - Document upload and management
- `/api/datasets/` - Training dataset management
- `/api/training-jobs/` - Training job control
- `/api/models/` - Trained model management
- `/api/extract/` - Document extraction endpoint
- `/api/feedback/` - User feedback for active learning

## Development Status

This project is currently in active development. Core backend infrastructure is complete, with the training engine and frontend UI in progress.