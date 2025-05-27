import React from 'react';
import { Box, Typography, Paper, IconButton, Stack, Button } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import InstagramIcon from '@mui/icons-material/Instagram';
import LanguageIcon from '@mui/icons-material/Language';
import EventIcon from '@mui/icons-material/Event';

const IntroPreview = ({ formData }) => {
  const {
    title,
    tagline,
    bio,
    companyName,
    companyUrl,
    twitterUrl,
    linkedinUrl,
    githubUrl,
    instagramUrl,
    personalWebsiteUrl,
    meetingUrl,
    websiteUrl
  } = formData;

  return (
    <Paper
      elevation={3}
      sx={{
        width: { xs: '100%', sm: 400 },
        minWidth: { xs: 'auto', sm: 400 },
        maxWidth: 400,
        minHeight: bio ? 350 : 'auto',
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
      
      {companyName && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            mt: 0.5,
            mb: bio ? 0 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5
          }}
        >
          {companyUrl ? (
            <Box 
              component="a" 
              href={companyUrl}
              target="_blank"
              rel="noopener"
              sx={{ 
                color: 'primary.main', 
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              @ {companyName}
            </Box>
          ) : (
            <>@ {companyName}</>
          )}
        </Typography>
      )}

      {bio && (
        <Box sx={{ 
          mt: companyName ? 3 : 3, 
          mb: 2, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center' 
        }}>
          <Typography 
            variant="body1" 
            align="center"
            sx={{ 
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            {bio}
          </Typography>
        </Box>
      )}

      {(personalWebsiteUrl || meetingUrl || websiteUrl) && (
        <Box sx={{ mb: 2, mt: bio ? 2 : (companyName ? 2 : 3) }}>
          <Stack direction="column" spacing={1.5} alignItems="center">
            {personalWebsiteUrl && (
              <Button 
                variant="outlined" 
                size="small"
                component="a" 
                href={personalWebsiteUrl} 
                target="_blank" 
                rel="noopener"
                startIcon={<LanguageIcon fontSize="small" />}
                sx={{ 
                  borderRadius: 4,
                  textTransform: 'none',
                  px: 2,
                  minWidth: 180,
                  maxWidth: '90%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                Visit My Website
              </Button>
            )}
            
            {meetingUrl && (
              <Button 
                variant="outlined" 
                size="small"
                component="a" 
                href={meetingUrl} 
                target="_blank" 
                rel="noopener"
                startIcon={<EventIcon fontSize="small" />}
                sx={{ 
                  borderRadius: 4,
                  textTransform: 'none',
                  px: 2,
                  minWidth: 180,
                  maxWidth: '90%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                Schedule a Meeting
              </Button>
            )}
            
            {websiteUrl && (
              <Button 
                variant="outlined" 
                size="small"
                component="a" 
                href={websiteUrl} 
                target="_blank" 
                rel="noopener"
                startIcon={<LanguageIcon fontSize="small" />}
                sx={{ 
                  borderRadius: 4,
                  textTransform: 'none',
                  px: 2,
                  minWidth: 180,
                  maxWidth: '90%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                Visit Project Site
              </Button>
            )}
          </Stack>
        </Box>
      )}

      <Box sx={{ mt: bio ? 'auto' : 2, pt: 2 }}>
        <Stack 
          direction="row" 
          spacing={2} 
          justifyContent="center" 
        >
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
          
          {twitterUrl ? (
            <IconButton href={twitterUrl} target="_blank" rel="noopener">
              <TwitterIcon />
            </IconButton>
          ) : (
            <IconButton disabled sx={{ color: 'rgba(0, 0, 0, 0.3)' }}>
              <TwitterIcon />
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
