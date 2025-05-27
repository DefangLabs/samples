import React, { useState } from 'react';
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
  Divider
} from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import EventIcon from '@mui/icons-material/Event';
import LanguageIcon from '@mui/icons-material/Language';
import PaletteIcon from '@mui/icons-material/Palette';
import DeleteIcon from '@mui/icons-material/Delete';
import ColorPicker from './ColorPicker';
import AvatarUpload from './AvatarUpload';
import CardPreview from './CardPreview';

const CardCreator = () => {
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
    avatar: '' // New field for profile avatar (stores base64 image data)
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Make sure to format all URL fields with proper https:// prefixes
    const formattedMeetingUrl = formatUrl(formData.meetingUrl);
    const formattedPersonalWebsiteUrl = formatUrl(formData.personalWebsiteUrl);
    const formattedWebsiteUrl = formatUrl(formData.websiteUrl);
    const formattedCompanyUrl = formatUrl(formData.companyUrl);
    
    // Check if the avatar image data is too large (over 5MB)
    let avatarData = formData.avatar;
    if (avatarData && avatarData.length > 5 * 1024 * 1024) {
      console.warn('Avatar image is too large, compressing...');
      // For extremely large images, we might need to skip them
      if (avatarData.length > 10 * 1024 * 1024) {
        console.error('Avatar image exceeds maximum size limit');
        setSnackbarMessage('Avatar image is too large. Please use a smaller image (< 5MB).');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }
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
      avatar: avatarData, // Include avatar image data
      social_media: {
        linkedin: formatSocialUrl(formData.linkedinUrl, 'linkedin'),
        github: formatSocialUrl(formData.githubUrl, 'github'),
        twitter: formatSocialUrl(formData.twitterUrl, 'twitter'),
        instagram: formatSocialUrl(formData.instagramUrl, 'instagram'),
        facebook: formatSocialUrl(formData.facebookUrl, 'facebook')
      }
    };
    
    console.log('Form submitted:', apiData);
    
    // Submit the form data to the server
    fetch('http://localhost:3010/cards', {
      method: 'POST',
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
        avatar: '' // Reset avatar to default (empty)
      });
      
      // Show success message
      const hasAvatar = apiData.avatar ? ' with profile photo' : '';
      setSnackbarMessage(`Card "${apiData.card_name}"${hasAvatar} created successfully!`);
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
    })
    .catch(error => {
      console.error('Error submitting form:', error);
      setSnackbarMessage('Failed to create card. Please try again.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={{ xs: 2, md: 4 }} direction={{ xs: 'row', sm: 'row' }}>
        <Grid item xs={12} lg={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Create Your Card
            </Typography>
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

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2 }}>
                      <PaletteIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary', fontSize: '16px' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 2, fontSize: '12px' }}>
                        Card Theme:
                      </Typography>
                      <ColorPicker 
                        color={formData.backgroundColor} 
                        onChange={(color) => setFormData(prev => ({...prev, backgroundColor: color}))}
                      />
                      
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
                  <AvatarUpload 
                    avatarImage={formData.avatar}
                    avatarBgColor={formData.avatarBackgroundColor}
                    onAvatarChange={(imageData) => {
                      console.log('Avatar changed, updating form data');
                      setFormData(prev => ({ ...prev, avatar: imageData }));
                    }}
                    onAvatarRemove={() => setFormData(prev => ({ ...prev, avatar: '' }))}
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

              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                type="submit" 
                sx={{ mt: 3, mb: 2, py: 1.5, backgroundColor: '#000', '&:hover': { backgroundColor: '#333' } }}
              >
                Generate Card
              </Button>
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
