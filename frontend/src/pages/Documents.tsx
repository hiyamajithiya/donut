import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Avatar,
  Tooltip,
  FormControl,
  Select,
  InputLabel,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CloudUpload as UploadIcon,
  Description as DocumentIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  PlayArrow as RetryIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'uploaded' | 'processing' | 'labeled' | 'trained' | 'error' | 'completed';
  progress: number;
  accuracy?: number;
  confidence?: number;
  size: number;
  pages: number;
  uploadedAt: string;
  processedAt?: string;
  lastUpdated: string;
  extractedFields?: number;
  totalFields?: number;
  errorMessage?: string;
}

const Documents: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data
  useEffect(() => {
    const mockDocuments: Document[] = [
      {
        id: '1',
        name: 'Invoice_2024_001.pdf',
        type: 'Invoice',
        status: 'completed',
        progress: 100,
        accuracy: 96.5,
        confidence: 94.2,
        size: 2048576,
        pages: 3,
        uploadedAt: '2024-01-15T10:30:00Z',
        processedAt: '2024-01-15T10:35:00Z',
        lastUpdated: '2024-01-15T14:22:00Z',
        extractedFields: 12,
        totalFields: 12,
      },
      {
        id: '2',
        name: 'Contract_ABC_Corp.pdf',
        type: 'Contract',
        status: 'processing',
        progress: 65,
        size: 5242880,
        pages: 15,
        uploadedAt: '2024-01-15T11:15:00Z',
        lastUpdated: '2024-01-15T14:20:00Z',
        extractedFields: 8,
        totalFields: 15,
      },
      {
        id: '3',
        name: 'Receipt_Store_123.jpg',
        type: 'Receipt',
        status: 'labeled',
        progress: 80,
        accuracy: 89.2,
        confidence: 87.5,
        size: 1048576,
        pages: 1,
        uploadedAt: '2024-01-15T09:45:00Z',
        lastUpdated: '2024-01-15T13:10:00Z',
        extractedFields: 6,
        totalFields: 8,
      },
      {
        id: '4',
        name: 'Form_Application.pdf',
        type: 'Form',
        status: 'error',
        progress: 30,
        size: 3145728,
        pages: 5,
        uploadedAt: '2024-01-15T08:20:00Z',
        lastUpdated: '2024-01-15T12:50:00Z',
        extractedFields: 0,
        totalFields: 20,
        errorMessage: 'Text extraction failed - document may be corrupted',
      },
      {
        id: '5',
        name: 'Invoice_2024_002.pdf',
        type: 'Invoice',
        status: 'trained',
        progress: 100,
        accuracy: 98.1,
        confidence: 96.7,
        size: 1572864,
        pages: 2,
        uploadedAt: '2024-01-14T16:20:00Z',
        processedAt: '2024-01-14T16:25:00Z',
        lastUpdated: '2024-01-14T18:30:00Z',
        extractedFields: 12,
        totalFields: 12,
      },
    ];

    setTimeout(() => {
      setDocuments(mockDocuments);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, doc: Document) => {
    setAnchorEl(event.currentTarget);
    setSelectedDoc(doc);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDoc(null);
  };

  const handleDelete = () => {
    if (selectedDoc) {
      setDeleteDialogOpen(true);
    }
    handleMenuClose();
  };

  const confirmDelete = () => {
    if (selectedDoc) {
      setDocuments(docs => docs.filter(d => d.id !== selectedDoc.id));
    }
    setDeleteDialogOpen(false);
    setSelectedDoc(null);
  };

  const handleRetry = () => {
    if (selectedDoc) {
      setDocuments(docs =>
        docs.map(d =>
          d.id === selectedDoc.id
            ? { ...d, status: 'processing' as const, progress: 0, errorMessage: undefined }
            : d
        )
      );
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'trained':
        return 'success';
      case 'processing':
        return 'info';
      case 'labeled':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'trained':
        return <SuccessIcon fontSize="small" />;
      case 'processing':
        return <PendingIcon fontSize="small" />;
      case 'error':
        return <ErrorIcon fontSize="small" />;
      default:
        return <DocumentIcon fontSize="small" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const documentTypes = Array.from(new Set(documents.map(d => d.type)));
  const statuses = ['uploaded', 'processing', 'labeled', 'trained', 'completed', 'error'];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Document Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Track and manage your document processing pipeline
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => navigate('/upload')}
        >
          Upload Documents
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <DocumentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {documents.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Documents
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <SuccessIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {documents.filter(d => ['completed', 'trained'].includes(d.status)).length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <PendingIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {documents.filter(d => d.status === 'processing').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Processing
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <ErrorIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {documents.filter(d => d.status === 'error').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Errors
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  {statuses.map(status => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  {documentTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => setLoading(true)}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Documents ({filteredDocuments.length})
          </Typography>

          {loading ? (
            <Box p={4} textAlign="center">
              <LinearProgress />
              <Typography mt={2} color="textSecondary">
                Loading documents...
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Document</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>Accuracy</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Uploaded</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDocuments
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((doc) => (
                        <TableRow key={doc.id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={2}>
                              {getStatusIcon(doc.status)}
                              <Box>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {doc.name}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {doc.pages} page{doc.pages !== 1 ? 's' : ''}
                                  {doc.extractedFields && doc.totalFields &&
                                    ` • ${doc.extractedFields}/${doc.totalFields} fields`
                                  }
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={doc.type} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={doc.status}
                              size="small"
                              color={getStatusColor(doc.status) as any}
                              variant="outlined"
                            />
                            {doc.errorMessage && (
                              <Tooltip title={doc.errorMessage}>
                                <ErrorIcon
                                  fontSize="small"
                                  color="error"
                                  sx={{ ml: 1, cursor: 'help' }}
                                />
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box width={100}>
                              <LinearProgress
                                variant="determinate"
                                value={doc.progress}
                                color={getStatusColor(doc.status) as any}
                                sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
                              />
                              <Typography variant="caption" color="textSecondary">
                                {doc.progress}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {doc.accuracy ? (
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {doc.accuracy}%
                                </Typography>
                                {doc.confidence && (
                                  <Typography variant="caption" color="textSecondary">
                                    Conf: {doc.confidence}%
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="textSecondary">
                                -
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatFileSize(doc.size)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(doc.uploadedAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              onClick={(e) => handleMenuClick(e, doc)}
                              size="small"
                            >
                              <MoreIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredDocuments.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Download
        </MenuItem>
        {selectedDoc?.status === 'error' && (
          <MenuItem onClick={handleRetry}>
            <RetryIcon fontSize="small" sx={{ mr: 1 }} />
            Retry Processing
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedDoc?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Documents;