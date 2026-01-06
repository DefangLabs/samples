import React from 'react';
import { Box, Typography, Button, Container, Paper, Divider, Grid } from '@mui/material';
import { Link } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShareIcon from '@mui/icons-material/Share';
import PaletteIcon from '@mui/icons-material/Palette';
import CropPortraitOutlinedIcon from '@mui/icons-material/CropPortraitOutlined';
import AddIcon from '@mui/icons-material/Add';

const HomePage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 3, md: 6 }, 
          textAlign: 'center', 
          mb: 6,
          borderRadius: 2,
          background: 'linear-gradient(145deg, #000000 0%, #212121 100%)',
          color: 'white'
        }}
      >
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 700,
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
          }}
        >
          Digital Profile Cards
        </Typography>
        <Typography 
          variant="h6" 
          paragraph
          sx={{ 
            maxWidth: 700, 
            mx: 'auto',
            mb: 4,
            color: 'rgba(255,255,255,0.9)',
            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
          }}
        >
          Create beautiful, shareable digital profile cards to showcase your professional identity and connect with others.
        </Typography>
        <Box sx={{ mt: 5 }}>
          <Button 
            component={Link} 
            to="/edit" 
            variant="contained" 
            color="primary" 
            size="large"
            startIcon={<AddIcon />}
            sx={{ 
              px: 4, 
              py: 1.5, 
              bgcolor: '#3f51b5', 
              '&:hover': { bgcolor: '#303f9f' },
              borderRadius: 2,
              boxShadow: '0 4px 14px 0 rgba(63, 81, 181, 0.4)'
            }}
          >
            Create Your Card
          </Button>
        </Box>
      </Paper>
      
      {/* Call to Action Section */}
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography 
          variant="h4" 
          component="h2" 
          gutterBottom 
          align="center" 
          sx={{ mb: 2, fontWeight: 600 }}
        >
          Ready to Get Started?
        </Typography>
        <Typography 
          variant="body1" 
          align="center" 
          color="text.secondary" 
          sx={{ maxWidth: 700, mx: 'auto', mb: 5 }}
        >
          Create and manage your digital profile cards. Make multiple cards for different purposes or to showcase various aspects of your professional identity.
        </Typography>
        <Divider sx={{ mb: 5 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap', mt: 6 }}>
          <Button 
            component={Link} 
            to="/edit" 
            variant="contained" 
            size="large"
            startIcon={<AddIcon />}
            sx={{ 
              px: 4, 
              py: 2, 
              borderRadius: 2,
              bgcolor: '#3f51b5',
              '&:hover': { bgcolor: '#303f9f' },
              boxShadow: '0 4px 14px 0 rgba(63, 81, 181, 0.4)'
            }}
          >
            Create New Card
          </Button>
          
          <Button 
            component={Link} 
            to="/cards" 
            variant="outlined" 
            size="large"
            startIcon={<CropPortraitOutlinedIcon />}
            sx={{ 
              px: 4, 
              py: 2, 
              borderRadius: 2,
              borderColor: '#3f51b5',
              color: '#3f51b5',
              '&:hover': { 
                borderColor: '#303f9f',
                bgcolor: 'rgba(63, 81, 181, 0.04)'
              }
            }}
          >
            View My Cards
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default HomePage;
