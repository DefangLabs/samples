import React from 'react';
import { Box, Typography, Container, Divider, Paper, Button } from '@mui/material';
import CardDisplay from '../../components/CardDisplay/CardDisplay';
import { Link } from 'react-router-dom';
import ViewListIcon from '@mui/icons-material/ViewList';
import AddIcon from '@mui/icons-material/Add';

const CardsPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          background: 'linear-gradient(to right, #3f51b5, #536dfe)',
          color: 'white',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 0 } }}>
          <ViewListIcon sx={{ fontSize: 32, mr: 2 }} />
          <Box>
            <Typography variant="h5" component="h1" fontWeight={600}>
              Your Cards
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
              Manage and view all your digital profile cards
            </Typography>
          </Box>
        </Box>

        <Button
          component={Link}
          to="/edit"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            bgcolor: 'white',
            color: '#3f51b5',
            '&:hover': { bgcolor: '#f5f5f5' },
            fontWeight: 500,
            px: 2
          }}
        >
          Create New Card
        </Button>
      </Paper>
      
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="body1" 
          align="center" 
          color="text.secondary" 
          sx={{ maxWidth: 700, mx: 'auto', mb: 3 }}
        >
          Create multiple cards for different purposes or to showcase various aspects of your professional identity.
          Each card can be shared individually and presents a unique digital presence.
        </Typography>
        <Divider sx={{ mb: 4 }} />
      </Box>
      
      <CardDisplay />
    </Container>
  );
};

export default CardsPage;
