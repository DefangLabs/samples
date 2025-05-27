import React, { useState } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Container,
  InputAdornment
} from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import EventIcon from '@mui/icons-material/Event';
import LanguageIcon from '@mui/icons-material/Language';
import IntroPreview from './IntroPreview';

const IntroForm = () => {
  const [formData, setFormData] = useState({
    emoji: '👋',
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
    websiteUrl: '' // this will map to additional_urls
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper function to format URLs properly
  const formatUrl = (url) => {
    if (!url) return '';
    
    // Clean up URL - trim whitespace
    let cleanUrl = url.trim();
    
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
        github: /github\.com\/([^\/\?#]+)/i,
        linkedin: /linkedin\.com\/in\/([^\/\?#]+)/i,
        twitter: /(?:twitter\.com|x\.com)\/([^\/\?#]+)/i,
        instagram: /instagram\.com\/([^\/\?#]+)/i,
        facebook: /facebook\.com\/([^\/\?#]+)/i
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
    
    // Format data for API submission
    const apiData = {
      card_name: formData.title || formData.name,
      name: formData.name,
      headline: formData.tagline,
      bio: formData.bio,
      company_name: formData.companyName,
      company_url: formatUrl(formData.companyUrl),
      meeting_link: formatUrl(formData.meetingUrl),
      personal_website: formatUrl(formData.personalWebsiteUrl),
      additional_urls: formatUrl(formData.websiteUrl),
      social_media: {
        linkedin: formatSocialUrl(formData.linkedinUrl, 'linkedin'),
        github: formatSocialUrl(formData.githubUrl, 'github'),
        twitter: formatSocialUrl(formData.twitterUrl, 'twitter'),
        instagram: formatSocialUrl(formData.instagramUrl, 'instagram'),
        facebook: formatSocialUrl(formData.facebookUrl, 'facebook')
      }
    };
    
    console.log('Form submitted:', apiData);
    
    // Here you would handle the form submission
    // For example: 
    // fetch('http://localhost:3010/cards', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(apiData)
    // })
    // .then(response => response.json())
    // .then(data => console.log('Success:', data))
    // .catch(error => console.error('Error:', error));
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
                  Name *
                </Typography>
                <TextField
                  fullWidth
                  required
                  name="name"
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
            <IntroPreview formData={formData} />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default IntroForm;
