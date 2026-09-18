import React from 'react';
import { Box, Typography, Paper, IconButton, Stack, Button, Avatar } from '@mui/material';
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
    websiteUrl,
    backgroundColor,
    avatarBackgroundColor,
    avatar
  } = formData;

  // Check if the background is dark
  const isDarkTheme = backgroundColor === '#212121' || backgroundColor === '#000000';
  
  // Check if any social media links are available
  const hasSocialLinks = linkedinUrl || githubUrl || twitterUrl || instagramUrl || facebookUrl;
  
  // Determine primary profile link in priority order: LinkedIn > Personal Website > Company
  const getPrimaryProfileLink = () => {
    if (linkedinUrl) return sanitizeUrl(linkedinUrl);
    if (personalWebsiteUrl) return sanitizeUrl(personalWebsiteUrl);
    if (companyUrl) return sanitizeUrl(companyUrl);
    return null;
  };
  
  // Helper function to sanitize URLs and remove localhost references
  const sanitizeUrl = (url) => {
    if (!url) return '';
    
    // Clean up URL
    let cleanUrl = url.trim();
    
    // Remove localhost references
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
    
    // Add https:// if needed
    if (!/^https?:\/\//i.test(cleanUrl)) {
      return `https://${cleanUrl}`;
    }
    
    return cleanUrl;
  };

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
        flexDirection: 'column',
        backgroundColor: backgroundColor || '#ffffff',
        color: backgroundColor && 
               (backgroundColor === '#212121' || backgroundColor === '#000000') 
               ? '#ffffff' : 'inherit'
      }}
    >
      {/* Share button in top right corner */}
      <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
        <IconButton 
          size="small" 
          sx={{ color: isDarkTheme ? '#ffffff' : 'inherit' }}
        >
          <ShareIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Centered avatar with colored background */}
      {avatar && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mb: 4, 
          mt: 4
        }}>
          <Box sx={{
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: avatarBackgroundColor === 'transparent' ? 'transparent' : 
                       `radial-gradient(circle, transparent 60%, ${
                          isDarkTheme && (avatarBackgroundColor === '#000000' || avatarBackgroundColor === '#ffffff') ? '#ffffff' : 
                          avatarBackgroundColor === '#ffffff' && !isDarkTheme ? '#e0e0e0' : 
                          avatarBackgroundColor
                        }60 85%, ${
                          isDarkTheme && (avatarBackgroundColor === '#000000' || avatarBackgroundColor === '#ffffff') ? '#ffffff' : 
                          avatarBackgroundColor === '#ffffff' && !isDarkTheme ? '#e0e0e0' : 
                          avatarBackgroundColor
                        }20 95%, transparent 100%)`,
            boxShadow: avatarBackgroundColor === 'transparent' ? 'none' : 
                      `0 0 10px 2px ${
                          isDarkTheme && (avatarBackgroundColor === '#000000' || avatarBackgroundColor === '#ffffff') ? '#ffffff70' : 
                          avatarBackgroundColor === '#ffffff' && !isDarkTheme ? '#e0e0e070' : 
                          `${avatarBackgroundColor}70`
                      }, 0 0 15px 5px ${
                          isDarkTheme && (avatarBackgroundColor === '#000000' || avatarBackgroundColor === '#ffffff') ? '#ffffff40' : 
                          avatarBackgroundColor === '#ffffff' && !isDarkTheme ? '#e0e0e040' : 
                          `${avatarBackgroundColor}40`
                      }`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {getPrimaryProfileLink() ? (
              <Box
                component="a"
                href={getPrimaryProfileLink()}
                target="_blank"
                rel="noopener"
                sx={{
                  display: 'block',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  }
                }}
              >
                <Avatar 
                  src={avatar}
                  alt={title || 'Profile'}
                  sx={{ 
                    width: 166, 
                    height: 166,
                    border: avatarBackgroundColor === 'transparent' ? 'none' : 
                            (avatarBackgroundColor === '#ffffff' ? 
                              `3px solid ${isDarkTheme ? '#ffffff' : '#e0e0e0'}` : 
                              `3px solid ${isDarkTheme ? '#ffffff' : 'rgba(255,255,255,0.85)'}`),
                  }}
                />
              </Box>
            ) : (
              <Avatar 
                src={avatar}
                alt={title || 'Profile'}
                sx={{ 
                  width: 166, 
                  height: 166,
                  border: avatarBackgroundColor === 'transparent' ? 'none' : 
                          (avatarBackgroundColor === '#ffffff' ? 
                            `3px solid ${isDarkTheme ? '#ffffff' : '#e0e0e0'}` : 
                            `3px solid ${isDarkTheme ? '#ffffff' : 'rgba(255,255,255,0.85)'}`),
                }}
              />
            )}
          </Box>
        </Box>
      )}
      
      {/* Name */}
      <Box sx={{ textAlign: 'center', mt: avatar ? 1 : 4, mb: 1 }}>
        {personalWebsiteUrl ? (
          <Typography 
            variant="h5" 
            component="a"
            href={sanitizeUrl(personalWebsiteUrl)}
            target="_blank"
            rel="noopener"
            sx={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              color: 'inherit',
              textDecoration: 'none',
              display: 'block',
              mb: 0.5,
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
            sx={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              mb: 0.5
            }}
          >
            {title || 'Your Name'}
          </Typography>
        )}

        {/* Tagline and Company */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 0.5
        }}>
          <Typography 
            variant="subtitle1" 
            color={isDarkTheme ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'}
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
              color={isDarkTheme ? '#ffffff' : 'text.secondary'}
              sx={{ 
                display: 'inline-flex',
                alignItems: 'center',
                ml: 0
              }}
            >
              {companyUrl ? (
                <Box 
                  component="a" 
                  href={sanitizeUrl(companyUrl)}
                  target="_blank"
                  rel="noopener"
                  sx={{ 
                    color: isDarkTheme ? '#ffffff' : 'primary.main', 
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    '&:hover': { 
                      textDecoration: 'underline',
                      color: isDarkTheme ? '#ffffff' : 'primary.dark'
                    }
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

      {/* Bio */}
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
            color={isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : 'inherit'}
            sx={{ 
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            {bio}
          </Typography>
        </Box>
      )}

      {/* Website and meeting buttons */}
      {(personalWebsiteUrl || meetingUrl || websiteUrl) && (
        <Box sx={{ mb: 2, mt: bio ? 2 : (companyName ? 2 : 3) }}>
          <Stack direction="column" spacing={1.5} alignItems="center">
            {personalWebsiteUrl && (
              <Button 
                variant="outlined" 
                size="small"
                component="a" 
                href={sanitizeUrl(personalWebsiteUrl)} 
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
                  whiteSpace: 'nowrap',
                  color: isDarkTheme ? '#ffffff' : undefined,
                  borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.5)' : undefined,
                  '&:hover': isDarkTheme ? {
                    borderColor: '#ffffff',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)'
                  } : undefined
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
                href={sanitizeUrl(meetingUrl)} 
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
                  whiteSpace: 'nowrap',
                  color: isDarkTheme ? '#ffffff' : undefined,
                  borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.5)' : undefined,
                  '&:hover': isDarkTheme ? {
                    borderColor: '#ffffff',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)'
                  } : undefined
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
                href={sanitizeUrl(websiteUrl)} 
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
                  whiteSpace: 'nowrap',
                  color: isDarkTheme ? '#ffffff' : undefined,
                  borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.5)' : undefined,
                  '&:hover': isDarkTheme ? {
                    borderColor: '#ffffff',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)'
                  } : undefined
                }}
              >
                Visit Project Site
              </Button>
            )}
          </Stack>
        </Box>
      )}

      {/* Social media icons */}
      {hasSocialLinks && (
        <Box sx={{ mt: bio ? 'auto' : 2, pt: 2 }}>
          <Stack 
            direction="row" 
            spacing={2} 
            justifyContent="center" 
          >
            {linkedinUrl && (
              <IconButton 
                href={sanitizeUrl(linkedinUrl)} 
                target="_blank" 
                rel="noopener" 
                sx={{ color: isDarkTheme ? '#ffffff' : 'inherit' }}
              >
                <LinkedInIcon />
              </IconButton>
            )}
            
            {githubUrl && (
              <IconButton 
                href={sanitizeUrl(githubUrl)} 
                target="_blank" 
                rel="noopener" 
                sx={{ color: isDarkTheme ? '#ffffff' : 'inherit' }}
              >
                <GitHubIcon />
              </IconButton>
            )}
            
            {twitterUrl && (
              <IconButton 
                href={sanitizeUrl(twitterUrl)} 
                target="_blank" 
                rel="noopener" 
                sx={{ color: isDarkTheme ? '#ffffff' : 'inherit' }}
              >
                <TwitterIcon />
              </IconButton>
            )}
            
            {instagramUrl && (
              <IconButton 
                href={sanitizeUrl(instagramUrl)} 
                target="_blank" 
                rel="noopener" 
                sx={{ color: isDarkTheme ? '#ffffff' : 'inherit' }}
              >
                <InstagramIcon />
              </IconButton>
            )}

            {facebookUrl && (
              <IconButton 
                href={sanitizeUrl(facebookUrl)} 
                target="_blank" 
                rel="noopener" 
                sx={{ color: isDarkTheme ? '#ffffff' : 'inherit' }}
              >
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
