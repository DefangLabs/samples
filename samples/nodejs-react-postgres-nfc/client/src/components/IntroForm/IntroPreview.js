import React from 'react';
import { Box, Typography, Paper, IconButton, Stack } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import InstagramIcon from '@mui/icons-material/Instagram';

const IntroPreview = ({ formData }) => {
  const {
    title,
    tagline,
    body,
    twitterUrl,
    linkedinUrl,
    githubUrl,
    instagramUrl
  } = formData;

  return (
    <Paper
      elevation={3}
      sx={{
        width: { xs: '100%', sm: 400 },
        minWidth: { xs: 'auto', sm: 400 },
        maxWidth: 400,
        minHeight: 350,
        p: 3,
        textAlign: 'center',
        border: '1px solid #eaeaea',
        borderRadius: 2,
        m: 'auto',
        position: 'relative',
        boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton size="small">
          <ShareIcon fontSize="small" />
        </IconButton>
      </Box>

      <Typography 
        variant="h5" 
        gutterBottom
        sx={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          width: '100%'
        }}
      >
        {title || 'Your Name'}
      </Typography>
      
      <Typography 
        variant="subtitle1" 
        gutterBottom 
        color="text.secondary"
        sx={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          width: '100%'
        }}
      >
        {tagline || 'Your Tagline'}
      </Typography>

      <Box sx={{ my: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100px' }}>
        <Typography 
          variant="body1" 
          align="center"
          sx={{ 
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {body || 'Your introduction will appear here. Write something about yourself or your project.'}
        </Typography>
      </Box>

      <Box sx={{ mt: 'auto', pt: 2 }}>
        <Stack 
          direction="row" 
          spacing={2} 
          justifyContent="center" 
        >
          {twitterUrl ? (
            <IconButton href={twitterUrl} target="_blank" rel="noopener">
              <TwitterIcon />
            </IconButton>
          ) : (
            <IconButton disabled sx={{ color: 'rgba(0, 0, 0, 0.3)' }}>
              <TwitterIcon />
            </IconButton>
          )}
          
          {linkedinUrl ? (
            <IconButton href={linkedinUrl} target="_blank" rel="noopener">
              <LinkedInIcon />
            </IconButton>
          ) : (
            <IconButton disabled sx={{ color: 'rgba(0, 0, 0, 0.3)' }}>
              <LinkedInIcon />
            </IconButton>
          )}
          
          {githubUrl ? (
            <IconButton href={githubUrl} target="_blank" rel="noopener">
              <GitHubIcon />
            </IconButton>
          ) : (
            <IconButton disabled sx={{ color: 'rgba(0, 0, 0, 0.3)' }}>
              <GitHubIcon />
            </IconButton>
          )}
          
          {instagramUrl ? (
            <IconButton href={instagramUrl} target="_blank" rel="noopener">
              <InstagramIcon />
            </IconButton>
          ) : (
            <IconButton disabled sx={{ color: 'rgba(0, 0, 0, 0.3)' }}>
              <InstagramIcon />
            </IconButton>
          )}
        </Stack>
      </Box>
    </Paper>
  );
};

export default IntroPreview;
