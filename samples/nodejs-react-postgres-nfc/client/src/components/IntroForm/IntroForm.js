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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Format data for API submission
    const apiData = {
      card_name: formData.title || formData.name,
      name: formData.name,
      headline: formData.tagline,
      bio: formData.bio,
      company_name: formData.companyName,
      company_url: formData.companyUrl,
      meeting_link: formData.meetingUrl,
      personal_website: formData.personalWebsiteUrl, // Updated to use new field
      additional_urls: formData.websiteUrl,
      social_media: {
        linkedin: formData.linkedinUrl,
        github: formData.githubUrl,
        twitter: formData.twitterUrl,
        instagram: formData.instagramUrl,
        facebook: formData.facebookUrl
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
                  onChange={handleChange}
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
                  onChange={handleChange}
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
                  onChange={handleChange}
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
                  onChange={handleChange}
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
                  onChange={handleChange}
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
