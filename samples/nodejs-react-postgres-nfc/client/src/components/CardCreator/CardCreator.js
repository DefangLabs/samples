import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Container,
  InputAdornment,
  Snackbar,
  Alert,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
import { Link } from 'react-router-dom';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import EventIcon from '@mui/icons-material/Event';
import LanguageIcon from '@mui/icons-material/Language';
import PaletteIcon from '@mui/icons-material/Palette';
import GradientIcon from '@mui/icons-material/Gradient';
import DeleteIcon from '@mui/icons-material/Delete';
import ColorPicker from './ColorPicker';
import GradientPicker from './GradientPicker';
import AvatarUpload from './AvatarUpload';
import CardPreview from './CardPreview';
import 'react-image-crop/dist/ReactCrop.css';

const CardCreator = ({ existingCardData = null, isEditing = false }) => {
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  const [formData, setFormData] = useState({
    cardName: '', // new field for card identification
    name: '',
    title: '', // keeping this for backward compatibility with preview
    tagline: '', // this will map to headline
    bio: '', // changed from 'body' to match the label
    companyName: '', // Company name field
    companyUrl: '', // Company URL field
    linkedinUrl: '',
    githubUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    meetingUrl: '', // this will map to meeting_link
    personalWebsiteUrl: '', // this will map to personal_website (new field)
    websiteUrl: '', // this will map to additional_urls
    backgroundColor: '#ffffff', // New field for card background color
    avatarBackgroundColor: '#000000', // New field for avatar background color circle
    avatar: '', // New field for profile avatar (stores base64 image data)
    useGradient: false, // Whether to use gradient background instead of solid color
    backgroundGradient: { 
      id: 'subtle-blue',
      gradient: 'linear-gradient(135deg, #f5f7fa 0%, #e4eaff 100%)',
      color: '#333333'
    } // Gradient background object
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for URL fields to ensure proper formatting
    if (['meetingUrl', 'personalWebsiteUrl', 'websiteUrl', 'companyUrl'].includes(name)) {
      // If user is typing a URL and it doesn't start with http:// or https://, 
      // we don't immediately add the prefix while they're typing
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      // For non-URL fields, just update the value normally
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Helper function to format URLs properly
  const formatUrl = (url) => {
    if (!url) return '';
    
    // Clean up URL - trim whitespace
    let cleanUrl = url.trim();
    
    // Remove any localhost references
    if (cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1')) {
      const domains = ['github.com', 'linkedin.com', 'twitter.com', 'x.com', 'instagram.com', 'facebook.com'];
      for (const domain of domains) {
        if (cleanUrl.includes(domain)) {
          const parts = cleanUrl.split(domain);
          if (parts.length > 1) {
            cleanUrl = domain + parts[1];
            break;
          }
        }
      }
    }
    
    // If URL doesn't start with http:// or https://, add https://
    if (!/^https?:\/\//i.test(cleanUrl)) {
      return `https://${cleanUrl}`;
    }
    return cleanUrl;
  };

  // Helper function to format social media URLs
  const formatSocialUrl = (url, type) => {
    if (!url) return '';
    
    // Clean up the URL
    let cleanUrl = url.trim();
    
    // Special handling for localhost URLs with social domains
    if (cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1')) {
      // Extract the username and domain for URLs like http://localhost:3000/github.com/username
      const socialDomains = {
        github: /github\.com\/([^/?#]+)/i,
        linkedin: /linkedin\.com\/in\/([^/?#]+)/i,
        twitter: /(?:twitter\.com|x\.com)\/([^/?#]+)/i,
        instagram: /instagram\.com\/([^/?#]+)/i,
        facebook: /facebook\.com\/([^/?#]+)/i
      };
      
      const currentDomain = socialDomains[type];
      if (currentDomain) {
        const match = cleanUrl.match(currentDomain);
        if (match && match[1]) {
          // Extract the username from the URL
          if (type === 'linkedin') {
            return formatUrl(`linkedin.com/in/${match[1]}`);
          } else if (type === 'twitter') {
            return formatUrl(`x.com/${match[1]}`);
          } else {
            return formatUrl(`${type}.com/${match[1]}`);
          }
        }
      }
    }
    
    // Remove http://, https://, and www. prefixes for cleaner comparison
    cleanUrl = cleanUrl.replace(/^(https?:\/\/)?(www\.)?/i, '');
    
    // Standard URL processing
    switch (type) {
      case 'linkedin':
        if (!cleanUrl.startsWith('linkedin.com/in/')) {
          if (cleanUrl.startsWith('linkedin.com/')) {
            return formatUrl(cleanUrl);
          }
          return formatUrl(`linkedin.com/in/${cleanUrl}`);
        }
        break;
      case 'github':
        if (!cleanUrl.startsWith('github.com/')) {
          return formatUrl(`github.com/${cleanUrl}`);
        }
        break;
      case 'twitter':
        if (!cleanUrl.startsWith('twitter.com/') && !cleanUrl.startsWith('x.com/')) {
          return formatUrl(`x.com/${cleanUrl}`);
        }
        break;
      case 'instagram':
        if (!cleanUrl.startsWith('instagram.com/')) {
          return formatUrl(`instagram.com/${cleanUrl}`);
        }
        break;
      case 'facebook':
        if (!cleanUrl.startsWith('facebook.com/')) {
          return formatUrl(`facebook.com/${cleanUrl}`);
        }
        break;
      default:
        // For any other social media type, just format the URL as is
        console.log(`Unknown social media type: ${type}`);
        break;
    }
    
    return formatUrl(cleanUrl);
  };

  // Compress image and convert to base64
  const compressImage = (base64Image) => {
    return new Promise((resolve, reject) => {
      // Create an image to get dimensions
      const img = new Image();
      img.onload = () => {
        // Target dimensions - reasonable for profile pictures
        let targetWidth = 400;
        let targetHeight = 400;
        
        // Maintain aspect ratio
        if (img.width > img.height) {
          targetHeight = Math.round((targetWidth / img.width) * img.height);
        } else {
          targetWidth = Math.round((targetHeight / img.height) * img.width);
        }
        
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        
        // Apply smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw image at new size
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        // Get compressed image as base64 string with reduced quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        
        resolve(compressedBase64);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };
      
      img.src = base64Image;
    });
  };

  // Helper function for social media URLs - accepts various inputs
  const handleSocialMediaChange = (e) => {
    const { name, value } = e.target;
    let cleanUrl = value;
    
    if (value) {
      // Handle localhost URLs - extract just the username part
      if (value.includes('localhost') || value.includes('127.0.0.1')) {
        // For URLs like http://localhost:3000/github.com/KevyVo
        if (name === 'githubUrl' && value.includes('github.com/')) {
          const parts = value.split('github.com/');
          if (parts.length > 1) {
            cleanUrl = `github.com/${parts[1].split(/[?#/]/)[0]}`;
          }
        } else if (name === 'linkedinUrl' && value.includes('linkedin.com/in/')) {
          const parts = value.split('linkedin.com/in/');
          if (parts.length > 1) {
            cleanUrl = `linkedin.com/in/${parts[1].split(/[?#/]/)[0]}`;
          }
        } else if (name === 'twitterUrl' && (value.includes('twitter.com/') || value.includes('x.com/'))) {
          if (value.includes('twitter.com/')) {
            const parts = value.split('twitter.com/');
            if (parts.length > 1) {
              cleanUrl = `x.com/${parts[1].split(/[?#/]/)[0]}`;
            }
          } else {
            const parts = value.split('x.com/');
            if (parts.length > 1) {
              cleanUrl = `x.com/${parts[1].split(/[?#/]/)[0]}`;
            }
          }
        } else if (name === 'instagramUrl' && value.includes('instagram.com/')) {
          const parts = value.split('instagram.com/');
          if (parts.length > 1) {
            cleanUrl = `instagram.com/${parts[1].split(/[?#/]/)[0]}`;
          }
        } else if (name === 'facebookUrl' && value.includes('facebook.com/')) {
          const parts = value.split('facebook.com/');
          if (parts.length > 1) {
            cleanUrl = `facebook.com/${parts[1].split(/[?#/]/)[0]}`;
          }
        }
      } else {
        // Normal case - not localhost
        if (name === 'githubUrl') {
          if (value.includes('github.com/')) {
            const parts = value.split('github.com/');
            if (parts.length > 1) {
              cleanUrl = `github.com/${parts[1].split(/[?#/]/)[0]}`;
            }
          } else if (!value.includes('github') && !value.includes('http') && !value.includes('/')) {
            // Simple username entry
            cleanUrl = `github.com/${value}`;
          }
        } else if (name === 'linkedinUrl') {
          if (value.includes('linkedin.com/in/')) {
            const parts = value.split('linkedin.com/in/');
            if (parts.length > 1) {
              cleanUrl = `linkedin.com/in/${parts[1].split(/[?#/]/)[0]}`;
            }
          } else if (!value.includes('linkedin') && !value.includes('http') && !value.includes('/')) {
            // Simple username entry
            cleanUrl = `linkedin.com/in/${value}`;
          }
        } else if (name === 'twitterUrl') {
          if (value.includes('twitter.com/') || value.includes('x.com/')) {
            if (value.includes('twitter.com/')) {
              const parts = value.split('twitter.com/');
              if (parts.length > 1) {
                cleanUrl = `x.com/${parts[1].split(/[?#/]/)[0]}`;
              }
            } else {
              const parts = value.split('x.com/');
              if (parts.length > 1) {
                cleanUrl = `x.com/${parts[1].split(/[?#/]/)[0]}`;
              }
            }
          } else if (!value.includes('twitter') && !value.includes('x.com') && !value.includes('http') && !value.includes('/')) {
            // Simple username entry
            cleanUrl = `x.com/${value}`;
          }
        } else if (name === 'instagramUrl') {
          if (value.includes('instagram.com/')) {
            const parts = value.split('instagram.com/');
            if (parts.length > 1) {
              cleanUrl = `instagram.com/${parts[1].split(/[?#/]/)[0]}`;
            }
          } else if (!value.includes('instagram') && !value.includes('http') && !value.includes('/')) {
            // Simple username entry
            cleanUrl = `instagram.com/${value}`;
          }
        } else if (name === 'facebookUrl') {
          if (value.includes('facebook.com/')) {
            const parts = value.split('facebook.com/');
            if (parts.length > 1) {
              cleanUrl = `facebook.com/${parts[1].split(/[?#/]/)[0]}`;
            }
          } else if (!value.includes('facebook') && !value.includes('http') && !value.includes('/')) {
            // Simple username entry
            cleanUrl = `facebook.com/${value}`;
          }
        }
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: cleanUrl
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Make sure to format all URL fields with proper https:// prefixes
    const formattedMeetingUrl = formatUrl(formData.meetingUrl);
    const formattedPersonalWebsiteUrl = formatUrl(formData.personalWebsiteUrl);
    const formattedWebsiteUrl = formatUrl(formData.websiteUrl);
    const formattedCompanyUrl = formatUrl(formData.companyUrl);
    
    // Determine if we're editing or creating a new card
    const isUpdating = isEditing && existingCardData?.card_id;
    
    // Handle avatar image data - compress if needed
    let avatarData = formData.avatar;
    
    // Avatars are already compressed in the AvatarUpload component,
    // but we might need to further compress extremely large images 
    // that somehow made it through the initial compression
    try {
      if (avatarData) {
        if (avatarData.length > 2 * 1024 * 1024) {
          console.log('Further compressing large avatar image for database storage...');
          setSnackbarMessage('Optimizing image for storage...');
          setSnackbarSeverity('info');
          setOpenSnackbar(true);
          
          // For extremely large images that somehow got through, compress again
          avatarData = await compressImage(avatarData);
          console.log('Secondary compression complete');
        } else {
          console.log('Avatar image already at optimal size, no further compression needed');
        }
      }
    } catch (error) {
      console.error('Error during secondary image compression:', error);
      // Continue with existing image if compression fails
    }
    
    // Format data for API submission
    const apiData = {
      card_name: formData.cardName || formData.name,
      name: formData.name,
      headline: formData.tagline,
      bio: formData.bio,
      company_name: formData.companyName,
      company_url: formattedCompanyUrl,
      meeting_link: formattedMeetingUrl,
      personal_website: formattedPersonalWebsiteUrl,
      additional_urls: formattedWebsiteUrl,
      background_color: formData.backgroundColor, // Include background color
      avatar_bg_color: formData.avatarBackgroundColor, // Include avatar background color
      avatar: avatarData, // Include compressed avatar image data
      use_gradient: formData.useGradient, // Whether to use gradient background
      background_gradient: formData.useGradient ? formData.backgroundGradient : null, // Gradient data
      social_media: {
        linkedin: formatSocialUrl(formData.linkedinUrl, 'linkedin'),
        github: formatSocialUrl(formData.githubUrl, 'github'),
        twitter: formatSocialUrl(formData.twitterUrl, 'twitter'),
        instagram: formatSocialUrl(formData.instagramUrl, 'instagram'),
        facebook: formatSocialUrl(formData.facebookUrl, 'facebook')
      }
    };
    
    // Log size before and after compression
    if (formData.avatar && avatarData) {
      const originalSize = Math.round(formData.avatar.length / 1024);
      const compressedSize = Math.round(avatarData.length / 1024);
      const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);
      
      if (originalSize !== compressedSize) {
        console.log(`Image compression: ${originalSize}KB → ${compressedSize}KB (${reduction}% reduction)`);
      }
    }
    
    console.log('Form submitted:', apiData);
    
    // Submit the form data to the server - either create or update
    const url = isUpdating 
      ? `${process.env.REACT_APP_API_URL}/${existingCardData.card_id}` 
      : `${process.env.REACT_APP_API_URL}/cards`;
      
    const method = isUpdating ? 'PUT' : 'POST';
    
    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Success:', data);
      
      // Reset all form fields to their initial state
      setFormData({
        cardName: '',
        name: '',
        title: '',
        tagline: '',
        bio: '',
        companyName: '',
        companyUrl: '',
        linkedinUrl: '',
        githubUrl: '',
        twitterUrl: '',
        instagramUrl: '',
        facebookUrl: '',
        meetingUrl: '',
        personalWebsiteUrl: '',
        websiteUrl: '',
        backgroundColor: '#ffffff', // Reset background color to default
        avatarBackgroundColor: '#000000', // Reset avatar background color to default
        avatar: '', // Reset avatar to default (empty)
        useGradient: false, // Reset to solid color
        backgroundGradient: { 
          id: 'subtle-blue',
          gradient: 'linear-gradient(135deg, #f5f7fa 0%, #e4eaff 100%)',
          color: '#333333'
        } // Reset to default gradient
      });
      
      // Show success message
      const hasAvatar = apiData.avatar ? ' with profile photo' : '';
      const action = isUpdating ? 'updated' : 'created';
      setSnackbarMessage(`Card "${apiData.card_name}"${hasAvatar} ${action} successfully!`);
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      
      // If we're editing, redirect back to cards page after successful update
      if (isUpdating) {
        // Show success message for a moment before redirecting
        setTimeout(() => {
          window.location.href = '/cards';
        }, 1500);
      }
    })
    .catch(error => {
      console.error('Error submitting form:', error);
      setSnackbarMessage('Failed to create card. Please try again.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    });
  };

  // Function to handle card deletion
  const handleDeleteCard = () => {
    if (!isEditing || !existingCardData?.card_id) return;
    
    // Confirm deletion
    if (window.confirm(`Are you sure you want to delete the card "${formData.cardName}"? This action cannot be undone.`)) {
      fetch(`${process.env.REACT_APP_API_URL}/${existingCardData.card_id}`, {
        method: 'DELETE',
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to delete card');
        }
        return response.json();
      })
      .then(data => {
        console.log('Card deleted:', data);
        setSnackbarMessage('Card deleted successfully');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        
        // Redirect to cards page after deletion
        setTimeout(() => {
          window.location.href = '/cards';
        }, 1500);
      })
      .catch(error => {
        console.error('Error deleting card:', error);
        setSnackbarMessage('Failed to delete card');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      });
    }
  };

  // For existing card data loading
  useEffect(() => {
    if (existingCardData) {
      console.log('Loading existing card data:', existingCardData);
      setFormData({
        cardName: existingCardData.card_name || '',
        name: existingCardData.name || '',
        title: existingCardData.name || '', // For preview compatibility
        tagline: existingCardData.headline || '',
        bio: existingCardData.bio || '',
        companyName: existingCardData.company_name || '',
        companyUrl: existingCardData.company_url || '',
        linkedinUrl: existingCardData.linkedin || existingCardData.social_media?.linkedin || '',
        githubUrl: existingCardData.github || existingCardData.social_media?.github || '',
        twitterUrl: existingCardData.twitter || existingCardData.social_media?.twitter || '',
        instagramUrl: existingCardData.instagram || existingCardData.social_media?.instagram || '',
        facebookUrl: existingCardData.facebook || existingCardData.social_media?.facebook || '',
        meetingUrl: existingCardData.meeting_link || '',
        personalWebsiteUrl: existingCardData.personal_website || '',
        websiteUrl: existingCardData.additional_urls || '',
        backgroundColor: existingCardData.background_color || '#ffffff',
        avatarBackgroundColor: existingCardData.avatar_bg_color || '#000000',
        avatar: existingCardData.avatar || '',
        useGradient: existingCardData.use_gradient || false,
        backgroundGradient: existingCardData.background_gradient || {
          id: 'subtle-blue',
          gradient: 'linear-gradient(135deg, #f5f7fa 0%, #e4eaff 100%)',
          color: '#333333'
        }
      });
    }
  }, [existingCardData]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={{ xs: 2, md: 4 }} direction={{ xs: 'row', sm: 'row' }}>
        <Grid item xs={12} lg={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">
                {isEditing ? 'Edit Your Card' : 'Create Your Card'}
              </Typography>
              
              {isEditing && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteCard}
                  sx={{
                    borderColor: '#ffcdd2',
                    color: '#f44336',
                    '&:hover': {
                      backgroundColor: '#ffebee',
                      borderColor: '#ef9a9a'
                    }
                  }}
                >
                  Delete Card
                </Button>
              )}
            </Box>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <Box mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Card Name *
                </Typography>
                <TextField
                  fullWidth
                  required
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleChange}
                  placeholder="Enter a name for this card (e.g. Work Card, Personal Card)"
                  inputProps={{ maxLength: 100 }}
                />
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Profile
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 3 }}>
                  <Box sx={{ flexGrow: 1, width: '100%' }}>
                    <TextField
                      fullWidth
                      required
                      name="name"
                      label="Name *"
                      value={formData.name}
                      onChange={(e) => {
                        handleChange(e);
                        setFormData(prev => ({
                          ...prev,
                          title: e.target.value // Set title to name for backward compatibility
                        }));
                      }}
                      placeholder="Your Full Name"
                      inputProps={{ maxLength: 100 }}
                    />

                    <Box sx={{ mb: 2, mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PaletteIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary', fontSize: '16px' }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>
                            Card Background:
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ mr: 1, fontSize: '12px' }}
                          >
                            Solid
                          </Typography>
                          <Switch 
                            size="small"
                            checked={formData.useGradient}
                            onChange={(e) => setFormData(prev => ({...prev, useGradient: e.target.checked}))}
                            sx={{ mx: 0.5 }}
                          />
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ fontSize: '12px' }}
                          >
                            Gradient
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        {!formData.useGradient ? (
                          <>
                            <Typography variant="caption" color="text.secondary" sx={{ mr: 2, fontSize: '12px' }}>
                              Color:
                            </Typography>
                            <ColorPicker 
                              color={formData.backgroundColor} 
                              onChange={(color) => setFormData(prev => ({...prev, backgroundColor: color}))}
                            />
                          </>
                        ) : (
                          <>
                            <Typography variant="caption" color="text.secondary" sx={{ mr: 2, fontSize: '12px' }}>
                              Gradient:
                            </Typography>
                            <GradientPicker 
                              gradient={formData.backgroundGradient}
                              onSelect={(gradient) => setFormData(prev => ({...prev, backgroundGradient: gradient}))}
                            />
                          </>
                        )}
                        
                        {formData.avatar && (
                          <Box sx={{ display: 'flex', alignItems: 'center', ml: 4 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mr: 2, fontSize: '12px' }}>
                              Photo Outline:
                            </Typography>
                            <ColorPicker 
                              color={formData.avatarBackgroundColor}
                              onChange={(color) => setFormData(prev => ({...prev, avatarBackgroundColor: color}))}
                              colorType="outline"
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  <AvatarUpload 
                    avatarImage={formData.avatar}
                    avatarBgColor={formData.avatarBackgroundColor}
                    onAvatarChange={(imageData) => {
                      console.log('Avatar changed, updating form data');
                      setFormData(prev => ({ ...prev, avatar: imageData }));
                    }}
                    onAvatarRemove={() => setFormData(prev => ({ ...prev, avatar: '' }))
                    }
                  />
                </Box>
                
                {formData.avatar && (
                  <Box mt={1} mb={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="outlined" 
                      startIcon={<DeleteIcon />} 
                      onClick={() => setFormData(prev => ({ ...prev, avatar: '' }))}
                      size="small"
                      sx={{ 
                        fontSize: '12px',
                        color: '#666',
                        borderColor: '#ccc',
                        '&:hover': { 
                          color: '#333',
                          borderColor: '#999'
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </Box>
                )}
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Tagline *
                </Typography>
                <TextField
                  fullWidth
                  required
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  placeholder="A brief description or headline or job title"
                  inputProps={{ maxLength: 60 }}
                  helperText={`${formData.tagline.length}/60 characters`}
                />
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Company (Optional)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="companyName"
                      label="Company Name"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Company Name"
                      inputProps={{ maxLength: 100 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="companyUrl"
                      label="Company URL"
                      value={formData.companyUrl}
                      onChange={handleChange}
                      placeholder="https://company.com"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LanguageIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Bio (Optional)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself or maybe an interesting fact."
                  inputProps={{ maxLength: 500 }}
                  helperText={`${formData.bio.length}/500 characters`}
                />
              </Box>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                Social Links (Optional)
              </Typography>

              <Box mb={2}>
                <TextField
                  fullWidth
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleSocialMediaChange}
                  placeholder="LinkedIn URL"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkedInIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box mb={2}>
                <TextField
                  fullWidth
                  name="githubUrl"
                  value={formData.githubUrl}
                  onChange={handleSocialMediaChange}
                  placeholder="GitHub URL"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <GitHubIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box mb={2}>
                <TextField
                  fullWidth
                  name="twitterUrl"
                  value={formData.twitterUrl}
                  onChange={handleSocialMediaChange}
                  placeholder="Twitter URL"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TwitterIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box mb={2}>
                <TextField
                  fullWidth
                  name="instagramUrl"
                  value={formData.instagramUrl}
                  onChange={handleSocialMediaChange}
                  placeholder="Instagram URL"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <InstagramIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box mb={2}>
                <TextField
                  fullWidth
                  name="facebookUrl"
                  value={formData.facebookUrl}
                  onChange={handleSocialMediaChange}
                  placeholder="Facebook URL"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FacebookIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                Meeting Booking URL (Optional)
              </Typography>
              <Box mb={2}>
                <TextField
                  fullWidth
                  name="meetingUrl"
                  value={formData.meetingUrl}
                  onChange={handleChange}
                  placeholder="https://calendly.com/your-link"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EventIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  Add a link where people can book meetings with you (Calendly, Cal.com, etc.)
                </Typography>
              </Box>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                Personal Website (Optional)
              </Typography>
              <Box mb={2}>
                <TextField
                  fullWidth
                  name="personalWebsiteUrl"
                  value={formData.personalWebsiteUrl}
                  onChange={handleChange}
                  placeholder="https://yourpersonalsite.com"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LanguageIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  Your primary personal website or portfolio
                </Typography>
              </Box>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                Additional Website URL (Optional)
              </Typography>
              <Box mb={2}>
                <TextField
                  fullWidth
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  placeholder="https://yourproject.com"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LanguageIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  A secondary website like a project, blog, or company site
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mt: 3, mb: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth 
                  type="submit" 
                  sx={{ py: 1.5, backgroundColor: '#000', '&:hover': { backgroundColor: '#333' } }}
                >
                  {isEditing ? 'Save Changes' : 'Generate Card'}
                </Button>
                
                {isEditing && (
                  <Button
                    variant="outlined"
                    component={Link}
                    to="/cards"
                    sx={{ 
                      py: 1.5,
                      width: '30%',
                      borderColor: '#ccc',
                      color: '#666',
                      '&:hover': { 
                        borderColor: '#999',
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </Box>

              {isEditing && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Dangerous Zone: Card Deletion
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    If you want to delete this card, click the button below. This action is irreversible and will permanently delete the card and all its data.
                  </Typography>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleDeleteCard}
                    startIcon={<DeleteIcon />}
                    sx={{ 
                      py: 1.5, 
                      width: '100%',
                      '&:hover': { 
                        backgroundColor: '#c62828',
                        transform: 'scale(1.02)'
                      }
                    }}
                  >
                    Delete This Card
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Box sx={{
            position: { xs: 'relative', md: 'sticky' },
            top: { xs: 'auto', md: 0 },
            height: { xs: 'auto', md: '100vh' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: { xs: 4, md: 0 }
          }}>
            <CardPreview formData={formData} />
          </Box>
        </Grid>
      </Grid>
      
      {/* Snackbar notification that fades after a few seconds */}
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={2000} 
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setOpenSnackbar(false)} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CardCreator;
