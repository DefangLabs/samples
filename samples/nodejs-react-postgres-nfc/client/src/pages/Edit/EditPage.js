import React, { useState, useEffect } from 'react';
import CardCreator from '../../components/CardCreator/CardCreator';
import { Box, Typography, Container, Paper, Divider, Button, CircularProgress } from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import CropPortraitOutlinedIcon from '@mui/icons-material/CropPortraitOutlined';

const EditPage = () => {
  const { cardId } = useParams(); // Get the cardId from URL params
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Only fetch card data if we have a cardId
    if (cardId) {
      setLoading(true);
      
      fetch(`http://localhost:3010/cards/${cardId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch card: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Card data loaded:', data);
          setCardData(data.data?.card);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching card:', err);
          setError(err.message);
          setLoading(false);
        });
    }
  }, [cardId]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 2,
            background: 'linear-gradient(45deg, #3f51b5 30%, #536dfe 90%)',
            color: 'white',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' }
          }}
        >
          <EditIcon sx={{ mr: 2, fontSize: 28 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" component="h1" fontWeight={600}>
              {cardId ? 'Edit Existing Card' : 'Create New Card'}
            </Typography>
            <Typography variant="body1">
              {cardId 
                ? 'Update your digital profile card with new information or styling.' 
                : 'Customize your digital profile card with your information, links, and styling preferences.'
              }
            </Typography>
          </Box>
          <Button
            component={Link}
            to="/cards"
            variant="contained"
            startIcon={<CropPortraitOutlinedIcon />}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              color: '#3f51b5',
              '&:hover': { bgcolor: 'white' },
              ml: { xs: 0, sm: 2 },
              mt: { xs: 2, sm: 0 }
            }}
          >
            View All Cards
          </Button>
        </Paper>
        
        <Divider sx={{ mb: 4 }} />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
            <CircularProgress size={60} thickness={4} />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', my: 6 }}>
            <Typography color="error" variant="h6">
              Error loading card data: {error}
            </Typography>
            <Button component={Link} to="/edit" sx={{ mt: 2 }}>
              Create New Card Instead
            </Button>
          </Box>
        ) : (
          <CardCreator existingCardData={cardData} isEditing={Boolean(cardId)} />
        )}
      </Box>
    </Container>
  );
};

export default EditPage;
