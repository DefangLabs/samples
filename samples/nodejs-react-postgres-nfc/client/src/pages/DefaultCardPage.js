import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';
import CardPreview from '../components/CardCreator/CardPreview';

const DefaultCardPage = () => {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDefaultCard = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3010/cards/default');
        if (!response.ok) throw new Error('No default card found');
        const data = await response.json();
        setCard(data.data.card);
      } catch (err) {
        setError(err.message || 'Failed to fetch default card');
      } finally {
        setLoading(false);
      }
    };
    fetchDefaultCard();
  }, []);

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="40vh">
        <CircularProgress size={60} thickness={4} sx={{ color: '#3f51b5', mb: 3 }} />
        <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
          Loading your default card...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 5, textAlign: 'center', maxWidth: 600, mx: 'auto', mt: 4, borderRadius: 2 }}>
        <Typography variant="h5" color="error" gutterBottom fontWeight={600}>
          Unable to Load Default Card
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 450, mx: 'auto' }}>
          {error}
        </Typography>
      </Paper>
    );
  }

  if (!card) return null;

  // Determine text color based on background
  const bg = card.background_color || '#ffffff';
  // Simple luminance check for white/black text
  function getContrastYIQ(hexcolor) {
    let hex = hexcolor.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
    const r = parseInt(hex.substr(0,2),16);
    const g = parseInt(hex.substr(2,2),16);
    const b = parseInt(hex.substr(4,2),16);
    const yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 180) ? '#111' : '#fff';
  }
  const textColor = getContrastYIQ(bg);

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', my: 6 }}>
      <Box sx={{
        color: textColor,
        // Force all text, links, and icons to use textColor
        '& *': { color: `${textColor} !important`, fill: `${textColor} !important` },
        // For button border
        '& button, & .MuiButton-root': {
          borderColor: `${textColor} !important`,
        },
        // For svg icons
        '& svg': { color: `${textColor} !important`, fill: `${textColor} !important` },
        // For links
        '& a': { color: `${textColor} !important` },
      }}>
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
            },
            textColor
          }}
        />
      </Box>
    </Box>
  );
};

export default DefaultCardPage;
