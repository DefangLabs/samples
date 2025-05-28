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

const getContrastYIQ = (hexcolor) => {
  let hex = hexcolor.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
  const r = parseInt(hex.substr(0,2),16);
  const g = parseInt(hex.substr(2,2),16);
  const b = parseInt(hex.substr(4,2),16);
  const yiq = ((r*299)+(g*587)+(b*114))/1000;
  return (yiq >= 180) ? '#111' : '#fff';
};

const CardPreview = ({ formData, textColor: propTextColor }) => {
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
    avatar,
    useGradient,
    backgroundGradient
  } = formData;

  // Check if the background is dark based on the background type (solid or gradient)
  const isDarkTheme = useGradient 
    ? backgroundGradient?.color === '#ffffff'
    : backgroundColor === '#212121' || backgroundColor === '#000000';
  
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

  // Determine background style based on useGradient flag
  const getBackgroundStyle = () => {
    if (useGradient && backgroundGradient) {
      return {
        background: backgroundGradient.gradient,
        color: backgroundGradient.color || 'inherit'
      };
    } else {
      return {
        backgroundColor: backgroundColor || '#ffffff',
        color: backgroundColor && 
               (backgroundColor === '#212121' || backgroundColor === '#000000') 
               ? '#ffffff' : 'inherit'
      };
    }
  };

  // Prevent click event propagation for links
  const handleLinkClick = (event) => {
    event.stopPropagation();
  };

  // Compute text color for preview
  let previewTextColor = propTextColor;
  if (!previewTextColor) {
    if (useGradient && backgroundGradient && backgroundGradient.color) {
      previewTextColor = getContrastYIQ(backgroundGradient.color);
    } else if (backgroundColor) {
      previewTextColor = getContrastYIQ(backgroundColor);
    } else {
      previewTextColor = '#111';
    }
  }
  const colorOverride = { color: previewTextColor + ' !important' };
  const borderColorOverride = { borderColor: previewTextColor + ' !important' };

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
        ...getBackgroundStyle(),
        color: previewTextColor,
      }}
    >
      {/* Share button in top right corner */}
      <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
        <IconButton 
          size="small" 
          sx={colorOverride}
          onClick={(e) => e.stopPropagation()}
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
                onClick={(e) => e.stopPropagation()}
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
              ...colorOverride,
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              textDecoration: 'none',
              display: 'block',
              mb: 0.5,
              '&:hover': {
                color: previewTextColor,
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
              ...colorOverride,
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
            sx={{ 
              ...colorOverride,
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
              sx={{ 
                ...colorOverride,
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
                    ...colorOverride,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    '&:hover': { 
                      textDecoration: 'underline',
                      color: previewTextColor
                    }
                  }}
                >
                  {" "}@{companyName}
                </Box>
              ) : (
                <> {" "}@{companyName}</>
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
            sx={{ 
              ...colorOverride,
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
                  ...colorOverride,
                  ...borderColorOverride,
                  borderRadius: 4,
                  textTransform: 'none',
                  px: 2,
                  minWidth: 180,
                  maxWidth: '90%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    borderColor: previewTextColor,
                    backgroundColor: previewTextColor === '#fff' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
                  }
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
                  ...colorOverride,
                  ...borderColorOverride,
                  borderRadius: 4,
                  textTransform: 'none',
                  px: 2,
                  minWidth: 180,
                  maxWidth: '90%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    borderColor: previewTextColor,
                    backgroundColor: previewTextColor === '#fff' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
                  }
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
                  ...colorOverride,
                  ...borderColorOverride,
                  borderRadius: 4,
                  textTransform: 'none',
                  px: 2,
                  minWidth: 180,
                  maxWidth: '90%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    borderColor: previewTextColor,
                    backgroundColor: previewTextColor === '#fff' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
                  }
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
                sx={colorOverride}
              >
                <LinkedInIcon />
              </IconButton>
            )}
            {githubUrl && (
              <IconButton 
                href={sanitizeUrl(githubUrl)} 
                target="_blank" 
                rel="noopener" 
                sx={colorOverride}
              >
                <GitHubIcon />
              </IconButton>
            )}
            {twitterUrl && (
              <IconButton 
                href={sanitizeUrl(twitterUrl)} 
                target="_blank" 
                rel="noopener" 
                sx={colorOverride}
              >
                <TwitterIcon />
              </IconButton>
            )}
            {instagramUrl && (
              <IconButton 
                href={sanitizeUrl(instagramUrl)} 
                target="_blank" 
                rel="noopener" 
                sx={colorOverride}
              >
                <InstagramIcon />
              </IconButton>
            )}
            {facebookUrl && (
              <IconButton 
                href={sanitizeUrl(facebookUrl)} 
                target="_blank" 
                rel="noopener" 
                sx={colorOverride}
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

export default CardPreview;
