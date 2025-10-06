import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  CardActionArea,
  Chip,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Description as InvoiceIcon,
  AccountBalance as BankIcon,
  Assignment as FormIcon,
  Business as BusinessIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';

interface Props {
  data: any;
  updateData: (data: any) => void;
}

const documentTypes = [
  {
    id: 'invoice',
    name: 'Invoice',
    icon: <InvoiceIcon sx={{ fontSize: 48 }} />,
    description: 'Extract vendor info, items, amounts, taxes',
    popular: true,
  },
  {
    id: 'bank_statement',
    name: 'Bank Statement',
    icon: <BankIcon sx={{ fontSize: 48 }} />,
    description: 'Extract account details, transactions, balances',
    popular: true,
  },
  {
    id: 'receipt',
    name: 'Receipt',
    icon: <ReceiptIcon sx={{ fontSize: 48 }} />,
    description: 'Extract merchant, items, total, date',
    popular: false,
  },
  {
    id: 'form_16',
    name: 'Form 16',
    icon: <FormIcon sx={{ fontSize: 48 }} />,
    description: 'Extract tax details, deductions, income',
    popular: true,
  },
  {
    id: 'expense_voucher',
    name: 'Expense Voucher',
    icon: <PaymentIcon sx={{ fontSize: 48 }} />,
    description: 'Extract expense type, amount, approvals',
    popular: false,
  },
  {
    id: 'balance_sheet',
    name: 'Balance Sheet',
    icon: <BusinessIcon sx={{ fontSize: 48 }} />,
    description: 'Extract assets, liabilities, equity',
    popular: false,
  },
];

const Step1SelectDocumentType: React.FC<Props> = ({ data, updateData }) => {
  const handleSelect = (typeId: string) => {
    updateData({ documentType: typeId });
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateData({ modelName: event.target.value });
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Select Document Type
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Choose the type of document you want to extract data from
      </Typography>

      {/* Model Name */}
      <Box mb={4}>
        <TextField
          fullWidth
          label="Model Name"
          placeholder="e.g., Invoice Extractor 2024"
          value={data.modelName || ''}
          onChange={handleNameChange}
          helperText="Give your model a descriptive name"
          required
        />
      </Box>

      {/* Document Types Grid */}
      <Grid container spacing={2}>
        {documentTypes.map((type) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={type.id}>
            <Card
              sx={{
                height: '100%',
                border: data.documentType === type.id ? '2px solid' : '1px solid',
                borderColor: data.documentType === type.id ? 'primary.main' : 'divider',
                bgcolor: data.documentType === type.id ? 'primary.lighter' : 'background.paper',
                position: 'relative',
              }}
            >
              <CardActionArea onClick={() => handleSelect(type.id)} sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  {type.popular && (
                    <Chip
                      label="Popular"
                      size="small"
                      color="primary"
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                    />
                  )}
                  <Box color={data.documentType === type.id ? 'primary.main' : 'text.secondary'} mb={2}>
                    {type.icon}
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {type.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {type.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Selection Summary */}
      {data.documentType && (
        <Box mt={3} p={2} bgcolor="success.lighter" borderRadius={2}>
          <Typography variant="body2" color="success.dark">
            ✓ Selected: <strong>{documentTypes.find((t) => t.id === data.documentType)?.name}</strong>
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Step1SelectDocumentType;
