import React, { useState, useRef, useEffect, memo } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Toolbar,
  Tooltip,
  Slider,
  ButtonGroup,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  ZoomOutMap as FitToWidthIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
} from '@mui/icons-material';

interface DocumentViewerProps {
  documentUrl?: string;
  documentName?: string;
  showAnnotationTools?: boolean;
  onAnnotationChange?: (annotations: any[]) => void;
  annotations?: any[];
  height?: number | string;
  width?: number | string;
}

interface Annotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fieldName: string;
  text?: string;
  page?: number;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentUrl,
  documentName = 'Document',
  showAnnotationTools = false,
  onAnnotationChange,
  annotations = [],
  height = 600,
  width = '100%',
}) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedField, setSelectedField] = useState<string>('');
  const [currentAnnotation, setCurrentAnnotation] = useState<Partial<Annotation> | null>(null);
  const [localAnnotations, setLocalAnnotations] = useState<Annotation[]>(annotations);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setLocalAnnotations(annotations);
  }, [annotations]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
  };

  const handleFitToWidth = () => {
    setZoom(100);
  };

  const handleRotateLeft = () => {
    setRotation(prev => prev - 90);
  };

  const handleRotateRight = () => {
    setRotation(prev => prev + 90);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    if (documentUrl) {
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = documentName;
      link.click();
    }
  };

  const handlePrint = () => {
    if (documentUrl) {
      const printWindow = window.open(documentUrl);
      printWindow?.print();
    }
  };

  // Annotation handling
  const startDrawing = (event: React.MouseEvent) => {
    if (!showAnnotationTools || !selectedField) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (event.clientX - rect.left) / (zoom / 100);
    const y = (event.clientY - rect.top) / (zoom / 100);

    setCurrentAnnotation({
      id: `annotation-${Date.now()}`,
      x,
      y,
      width: 0,
      height: 0,
      fieldName: selectedField,
      page: currentPage,
    });
    setIsDrawing(true);
  };

  const continueDrawing = (event: React.MouseEvent) => {
    if (!isDrawing || !currentAnnotation) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = (event.clientX - rect.left) / (zoom / 100);
    const currentY = (event.clientY - rect.top) / (zoom / 100);

    setCurrentAnnotation(prev => ({
      ...prev!,
      width: currentX - prev!.x!,
      height: currentY - prev!.y!,
    }));
  };

  const finishDrawing = () => {
    if (!isDrawing || !currentAnnotation) return;

    if (Math.abs(currentAnnotation.width!) > 10 && Math.abs(currentAnnotation.height!) > 10) {
      const newAnnotation = currentAnnotation as Annotation;
      const updatedAnnotations = [...localAnnotations, newAnnotation];
      setLocalAnnotations(updatedAnnotations);
      onAnnotationChange?.(updatedAnnotations);
    }

    setCurrentAnnotation(null);
    setIsDrawing(false);
  };

  const deleteAnnotation = (id: string) => {
    const updatedAnnotations = localAnnotations.filter(ann => ann.id !== id);
    setLocalAnnotations(updatedAnnotations);
    onAnnotationChange?.(updatedAnnotations);
  };

  const renderAnnotations = () => {
    return localAnnotations
      .filter(ann => ann.page === currentPage)
      .map(annotation => (
        <Box
          key={annotation.id}
          sx={{
            position: 'absolute',
            left: annotation.x * (zoom / 100),
            top: annotation.y * (zoom / 100),
            width: Math.abs(annotation.width) * (zoom / 100),
            height: Math.abs(annotation.height) * (zoom / 100),
            border: '2px solid #1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.2)',
            },
          }}
          onClick={() => deleteAnnotation(annotation.id)}
        >
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              top: -20,
              left: 0,
              backgroundColor: '#1976d2',
              color: 'white',
              px: 0.5,
              borderRadius: 0.5,
              fontSize: '10px',
            }}
          >
            {annotation.fieldName}
          </Typography>
        </Box>
      ));
  };

  return (
    <Paper
      ref={containerRef}
      sx={{
        height,
        width,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Toolbar */}
      <Toolbar variant="dense" sx={{ minHeight: 48, backgroundColor: 'grey.100' }}>
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          {documentName} {totalPages > 1 && `(Page ${currentPage} of ${totalPages})`}
        </Typography>

        <ButtonGroup size="small" sx={{ mr: 2 }}>
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut} disabled={zoom <= 25}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Box sx={{ display: 'flex', alignItems: 'center', px: 1, minWidth: 60 }}>
            <Typography variant="caption">{zoom}%</Typography>
          </Box>
          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn} disabled={zoom >= 300}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <ButtonGroup size="small" sx={{ mr: 2 }}>
          <Tooltip title="Rotate Left">
            <IconButton onClick={handleRotateLeft}>
              <RotateLeftIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Rotate Right">
            <IconButton onClick={handleRotateRight}>
              <RotateRightIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fit to Width">
            <IconButton onClick={handleFitToWidth}>
              <FitToWidthIcon />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <ButtonGroup size="small">
          <Tooltip title="Download">
            <IconButton onClick={handleDownload}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton onClick={handlePrint}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            <IconButton onClick={toggleFullscreen}>
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </Toolbar>

      {/* Document Content Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: 'grey.200',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: 'center',
            transition: 'transform 0.2s ease-in-out',
          }}
        >
          {documentUrl ? (
            <>
              <img
                ref={imageRef}
                src={documentUrl}
                alt={documentName}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  display: 'block',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
                onLoad={() => setTotalPages(1)} // This would be dynamic for multi-page docs
              />

              {/* Annotation Canvas */}
              {showAnnotationTools && (
                <canvas
                  ref={canvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    cursor: selectedField ? 'crosshair' : 'default',
                  }}
                  onMouseDown={startDrawing}
                  onMouseMove={continueDrawing}
                  onMouseUp={finishDrawing}
                />
              )}

              {/* Render Annotations */}
              {showAnnotationTools && renderAnnotations()}

              {/* Current Drawing Annotation */}
              {currentAnnotation && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: currentAnnotation.x! * (zoom / 100),
                    top: currentAnnotation.y! * (zoom / 100),
                    width: Math.abs(currentAnnotation.width!) * (zoom / 100),
                    height: Math.abs(currentAnnotation.height!) * (zoom / 100),
                    border: '2px dashed #1976d2',
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </>
          ) : (
            <Box
              sx={{
                width: 400,
                height: 500,
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed #ccc',
                borderRadius: 1,
              }}
            >
              <Typography color="textSecondary">
                No document loaded
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Zoom Slider (for touch devices) */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          width: 200,
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center',
          backgroundColor: 'white',
          borderRadius: 1,
          p: 1,
          boxShadow: 2,
        }}
      >
        <Typography variant="caption" sx={{ mr: 1 }}>
          Zoom:
        </Typography>
        <Slider
          value={zoom}
          onChange={(_, value) => setZoom(value as number)}
          min={25}
          max={300}
          step={25}
          size="small"
        />
      </Box>

      {/* Annotation Field Selector */}
      {showAnnotationTools && (
        <Fab
          color="primary"
          size="small"
          sx={{
            position: 'absolute',
            top: 70,
            right: 16,
          }}
          onClick={() => {
            // This would open a field selector dialog
            // For now, we'll just cycle through some example fields
            const fields = ['invoice_number', 'date', 'amount', 'vendor'];
            const currentIndex = fields.indexOf(selectedField);
            const nextIndex = (currentIndex + 1) % fields.length;
            setSelectedField(fields[nextIndex]);
          }}
        >
          <Typography variant="caption" sx={{ fontSize: '10px' }}>
            {selectedField || 'Field'}
          </Typography>
        </Fab>
      )}
    </Paper>
  );
};

export default memo(DocumentViewer);