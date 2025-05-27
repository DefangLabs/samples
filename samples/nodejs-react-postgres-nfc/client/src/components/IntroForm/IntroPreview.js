import React from 'react';
import { Box, Typography, Paper, IconButton, Stack, Button } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
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
    facebookUrl,
    personalWebsiteUrl,
    meetingUrl,
    websiteUrl
  } = formData;

  // Check if any social media links are available
  const hasSocialLinks = linkedinUrl || githubUrl || twitterUrl || instagramUrl || facebookUrl;

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

      {personalWebsiteUrl ? (
        <Typography 
          variant="h5" 
          gutterBottom
          component="a"
          href={personalWebsiteUrl}
          target="_blank"
          rel="noopener"
          sx={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            width: '100%',
            color: 'inherit',
            textDecoration: 'none',
            '&:hover': {
              color: 'primary.main',
              textDecoration: 'none'
            }
          }}
        >
          {title || 'Your Name'}
        </Typography>
      ) : (
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
      )}
      
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mb: 1
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 0.5
        }}>
          <Typography 
            variant="subtitle1" 
            color="text.secondary"
            sx={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              mb: 0,
              mr: 0.01
            }}
          >
            {tagline || 'Your Tagline'}
          </Typography>
          
          {companyName && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                display: 'inline-flex',
                alignItems: 'center',
                ml: 0
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
                  {" "}@{companyName}
                </Box>
              ) : (
                <>{" "}@{companyName}</>
              )}
            </Typography>
          )}
        </Box>
      </Box>

      {bio && (
        <Box sx={{ 
          mt: 3, 
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

      {/* Only show the social icons section if at least one social link exists */}
      {hasSocialLinks && (
        <Box sx={{ mt: bio ? 'auto' : 2, pt: 2 }}>
          <Stack 
            direction="row" 
            spacing={2} 
            justifyContent="center" 
          >
            {linkedinUrl && (
              <IconButton href={linkedinUrl} target="_blank" rel="noopener">
                <LinkedInIcon />
              </IconButton>
            )}
            
            {githubUrl && (
              <IconButton href={githubUrl} target="_blank" rel="noopener">
                <GitHubIcon />
              </IconButton>
            )}
            
            {twitterUrl && (
              <IconButton href={twitterUrl} target="_blank" rel="noopener">
                <TwitterIcon />
              </IconButton>
            )}
            
            {instagramUrl && (
              <IconButton href={instagramUrl} target="_blank" rel="noopener">
                <InstagramIcon />
              </IconButton>
            )}

            {facebookUrl && (
              <IconButton href={facebookUrl} target="_blank" rel="noopener">
                <FacebookIcon />
              </IconButton>
            )}
          </Stack>
        </Box>
      )}
    </Paper>
  );
};

export default IntroPreview;
