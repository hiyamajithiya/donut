import React from 'react';
import { Box, Container, Typography, Link, Divider } from '@mui/material';
import { Copyright as CopyrightIcon } from '@mui/icons-material';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[100],
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {/* Copyright */}
          <Box display="flex" alignItems="center" gap={1}>
            <CopyrightIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {currentYear} Chinmay Technosoft Private Limited. All rights reserved.
            </Typography>
          </Box>

          {/* Product Info */}
          <Box
            display="flex"
            gap={3}
            sx={{
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Donut Trainer v1.0
            </Typography>
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
            <Typography variant="body2" color="text.secondary">
              Powered by{' '}
              <Link
                href="https://www.chinmaytechnosoft.com"
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                color="primary"
              >
                Chinmay Technosoft
              </Link>
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
