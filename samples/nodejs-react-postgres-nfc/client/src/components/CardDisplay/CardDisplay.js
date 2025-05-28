import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Button, Grid } from '@mui/material';
import CardPreview from '../CardCreator/CardPreview';
import { Link, useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { styled } from '@mui/material/styles';


const DefaultCardBox = styled(Box)(({ theme, isdefault }) => ({
  border: isdefault === 'true' ? `2.5px solid ${theme.palette.primary.main}` : '2px solid transparent',
  boxShadow: isdefault === 'true' ? '0 0 16px 2px #3f51b540' : theme.shadows[2],
  borderRadius: 16,
  transition: 'border 0.2s, box-shadow 0.2s',
  position: 'relative',
  background: isdefault === 'true' ? '#f5faff' : '#fff',
}));

const CardDisplay = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch cards from the server
    const fetchCards = async () => {
      try {
        setLoading(true);
        console.log('Fetching cards from server...');
        const response = await fetch('http://localhost:3010/cards');
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`Failed to fetch cards: ${response.status} ${response.statusText}. ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Cards fetched successfully:', data);
        
        // Extract the cards array from the nested data structure
        if (data.data && data.data.cards) {
          console.log(`Found ${data.data.cards.length} cards in nested structure:`, data.data.cards);
          // Log card IDs for debugging
          console.log('Card IDs:', data.data.cards.map(c => c.card_id));
          setCards(data.data.cards);
        } else if (Array.isArray(data)) {
          console.log(`Found ${data.length} cards in array:`, data);
          // Log card IDs for debugging
          console.log('Card IDs:', data.map(c => c.card_id));
          setCards(data);
        } else {
          console.warn('No cards found in response:', data);
          setCards([]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching cards:', err);
        setError(err.message || 'Failed to fetch cards. Please try again later.');
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  // Set default card handler
  const handleSetDefault = async (e, cardId) => {
    e.stopPropagation(); // Prevent card click
    try {
      const res = await fetch(`http://localhost:3010/cards/${cardId}/set-default`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to set default card');
      // Update state: only one default
      setCards(cards => cards.map(card => ({ ...card, is_default: card.card_id === cardId })));
    } catch (err) {
      alert('Could not set default card.');
    }
  };

  // Default card data to show when no cards exist
  const defaultCardData = {
    title: 'Alex Johnson',
    tagline: 'Full Stack Developer',
    bio: 'Building innovative web applications with React, Node.js, and cloud technologies. Passionate about creating intuitive user experiences and scalable backend solutions.',
    companyName: 'TechNova',
    companyUrl: 'https://technova.example.com',
    linkedinUrl: 'https://linkedin.com/in/alexjohnson',
    githubUrl: 'https://github.com/alexjohnson',
    twitterUrl: 'https://twitter.com/alexjdev',
    personalWebsiteUrl: 'https://alexjohnson.dev',
    meetingUrl: 'https://calendly.com/alexjohnson/meeting',
    backgroundColor: '#212121',
    avatarBackgroundColor: '#3f51b5',
    // Use a more professional placeholder avatar
    avatar: 'https://i.pravatar.cc/300?img=12',
    // Showcase the gradient feature
    useGradient: true,
    backgroundGradient: {
      id: 'blue-purple',
      name: 'Blue Purple',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#ffffff'
    }
  };

  // Show loading spinner while fetching cards
  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="40vh"
      >
        <CircularProgress size={60} thickness={4} sx={{ color: '#3f51b5', mb: 3 }} />
        <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
          Loading your cards...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 400, textAlign: 'center' }}>
          We're retrieving your profile cards from the server. This should only take a moment.
        </Typography>
      </Box>
    );
  }

  // Show error message if fetching failed
  if (error) {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 5, 
          textAlign: 'center', 
          maxWidth: 600, 
          mx: 'auto', 
          mt: 4,
          borderRadius: 2,
          border: '1px solid #ffcdd2' 
        }}
      >
        <Box sx={{ mb: 3 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="11" stroke="#f44336" strokeWidth="2"/>
            <rect x="11" y="7" width="2" height="8" rx="1" fill="#f44336"/>
            <rect x="11" y="16" width="2" height="2" rx="1" fill="#f44336"/>
          </svg>
        </Box>
        <Typography variant="h5" color="error" gutterBottom fontWeight={600}>
          Unable to Load Cards
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 450, mx: 'auto' }}>
          We encountered a problem while trying to fetch your cards from the server. This could be due to a network issue or the server may be temporarily unavailable.
        </Typography>
        <Typography variant="body2" color="error" sx={{ mb: 4, p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
          {error}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={() => window.location.reload()}
            sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
          >
            Try Again
          </Button>
          <Button 
            component={Link} 
            to="/edit" 
            variant="contained" 
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              px: 3,
              bgcolor: '#3f51b5',
              '&:hover': { bgcolor: '#303f9f' }
            }}
          >
            Create New Card
          </Button>
        </Box>
      </Paper>
    );
  }

  // If there are no cards available
  if (cards.length === 0) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', my: 4, textAlign: 'center' }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            mb: 5, 
            backgroundColor: '#f9f9f9',
            border: '1px dashed #ccc',
            borderRadius: 2
          }}
        >
          <Typography variant="h5" gutterBottom color="primary.dark">
            No Cards Available Yet
          </Typography>
          <Typography variant="body1" paragraph>
            You haven't created any cards yet. Create your first card to get started!
          </Typography>
          <Button 
            component={Link} 
            to="/edit" 
            variant="contained" 
            color="primary"
            startIcon={<AddIcon />}
            sx={{ 
              mt: 2,
              backgroundColor: '#3f51b5',
              '&:hover': { backgroundColor: '#303f9f' },
              py: 1.2,
              px: 3,
              borderRadius: 2
            }}
          >
            Create Your First Card
          </Button>
        </Paper>
        
        {/* Display the default card preview with a nice header */}
        <Box sx={{ mt: 6, position: 'relative' }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Preview Example
          </Typography>
          
          <Box sx={{
            position: 'relative',
            '&:hover': {
              transform: 'translateY(-5px)',
              transition: 'transform 0.3s ease'
            }
          }}>
            <CardPreview formData={defaultCardData} />
          </Box>
          
          <Box sx={{ 
            mt: 3, 
            p: 2, 
            bgcolor: '#f5f5f5', 
            borderRadius: 2,
            border: '1px solid #e0e0e0'
          }}>
            <Typography variant="body2" color="text.secondary" align="center">
              This is an example of what your digital profile card could look like.
              <br />Create your own by clicking the button above!
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  // If there are cards, display them in a nice grid
  return (
    <Box>
      {/* Debug info - only visible during development */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mb: 4, p: 2, bgcolor: '#f0f0f0', borderRadius: 2 }}>
          <Typography variant="subtitle2">Debug Info:</Typography>
          <Typography variant="body2">Cards found: {cards.length}</Typography>
          <Typography variant="body2" sx={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
            IDs: {cards.map(c => c.card_id || c.id).join(', ')}
          </Typography>
        </Box>
      )}
      
      <Grid container spacing={4} sx={{ mt: 2 }}>
        {cards.map(card => (
          <Grid 
            item 
            xs={12} 
            md={6} 
            lg={4} 
            key={card.card_id || card.id || Math.random()} 
            className="card-container"
            sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)'
              }
            }}
          >
            <DefaultCardBox
              isdefault={card.is_default ? 'true' : 'false'}
              sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                cursor: 'pointer',
                pb: 2
              }}
              onClick={() => navigate(`/edit/${card.card_id}`)}
            >
              {/* Checkbox in top-left, stops click propagation */}
              <Box sx={{ position: 'absolute', top: 10, left: 10, right: 'unset', zIndex: 2 }} onClick={e => e.stopPropagation()}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!card.is_default}
                      onChange={e => handleSetDefault(e, card.card_id)}
                      color="primary"
                      inputProps={{ 'aria-label': 'Set as default card' }}
                    />
                  }
                  label={<Typography variant="caption" color="primary">Default</Typography>}
                  labelPlacement="end"
                  sx={{ ml: 0 }}
                />
              </Box>
              <Box sx={{ width: '100%' }}>
                {/* Show card_name above the card */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ textAlign: 'center', fontWeight: 500, mb: 1, letterSpacing: 0.5 }}>
                  {card.card_name}
                </Typography>
                <CardPreview 
                  formData={{
                    title: card.name,
                    tagline: card.headline,
                    bio: card.bio,
                    companyName: card.company_name,
                    companyUrl: card.company_url,
                    linkedinUrl: card.linkedin || card.social_media?.linkedin || '',
                    githubUrl: card.github || card.social_media?.github || '',
                    twitterUrl: card.twitter || card.social_media?.twitter || '',
                    instagramUrl: card.instagram || card.social_media?.instagram || '',
                    facebookUrl: card.facebook || card.social_media?.facebook || '',
                    personalWebsiteUrl: card.personal_website,
                    meetingUrl: card.meeting_link,
                    websiteUrl: card.additional_urls,
                    backgroundColor: card.background_color || '#ffffff',
                    avatarBackgroundColor: card.avatar_bg_color || '#000000',
                    avatar: card.avatar,
                    useGradient: card.use_gradient || false,
                    backgroundGradient: card.background_gradient || {
                      id: 'subtle-blue',
                      gradient: 'linear-gradient(135deg, #f5f7fa 0%, #e4eaff 100%)',
                      color: '#333333'
                    }
                  }}
                />
              </Box>
            </DefaultCardBox>
          </Grid>
        ))}
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 4 }}>
        <Button 
          component={Link} 
          to="/edit" 
          variant="contained" 
          color="primary"
          startIcon={<AddIcon />}
          sx={{ 
            backgroundColor: '#3f51b5',
            '&:hover': { backgroundColor: '#303f9f' },
            py: 1.2,
            px: 3,
            borderRadius: 2
          }}
        >
          Create New Card
        </Button>
      </Box>
    </Box>
  );
};

export default CardDisplay;
