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
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import InstagramIcon from '@mui/icons-material/Instagram';
import EventIcon from '@mui/icons-material/Event';
import LanguageIcon from '@mui/icons-material/Language';
import IntroPreview from './IntroPreview';

const IntroForm = () => {
  const [formData, setFormData] = useState({
    emoji: '👋',
    title: '',
    tagline: '',
    username: '',
    body: '',
    twitterUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    instagramUrl: '',
    meetingUrl: '',
    websiteUrl: ''
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
    console.log('Form submitted:', formData);
    // Here you would handle the form submission, e.g., send data to the server
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
                  Emoji (Optional)
                </Typography>
                <TextField
                  fullWidth
                  name="emoji"
                  value={formData.emoji}
                  onChange={handleChange}
                  placeholder="👋"
                />
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Title *
                </Typography>
                <TextField
                  fullWidth
                  required
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Your Name or Project Title"
                  inputProps={{ maxLength: 40 }}
                  helperText={`${formData.title.length}/40 characters`}
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
                  placeholder="A brief description or headline"
                  inputProps={{ maxLength: 60 }}
                  helperText={`${formData.tagline.length}/60 characters`}
                />
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Custom Username
                </Typography>
                <TextField
                  fullWidth
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="your-name"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">intro.new/</InputAdornment>,
                  }}
                />
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  Choose a custom username for your intro page (letters, numbers, and hyphens only)
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Body *
                </Typography>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={4}
                  name="body"
                  value={formData.body}
                  onChange={handleChange}
                  placeholder="Tell your story or describe your project..."
                  inputProps={{ maxLength: 500 }}
                  helperText={`${formData.body.length}/500 characters`}
                />
              </Box>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                Social Links (Optional)
              </Typography>

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
                Website URL (Optional)
              </Typography>
              <Box mb={2}>
                <TextField
                  fullWidth
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  placeholder="https://yourwebsite.com"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LanguageIcon />
                      </InputAdornment>
                    ),
                  }}
                />
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
