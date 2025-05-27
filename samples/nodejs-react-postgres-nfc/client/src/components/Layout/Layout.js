import React from 'react';
import { Box, AppBar, Toolbar, Typography, Button, Container, useMediaQuery, useTheme, IconButton } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import ViewListIcon from '@mui/icons-material/ViewList';
import GitHubIcon from '@mui/icons-material/GitHub';

const Layout = ({ children }) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar 
        position="static" 
        elevation={1}
        sx={{ 
          bgcolor: '#000000',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ px: { xs: 0, sm: 2 } }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                flexGrow: 1
              }}
            >
              <CardMembershipIcon sx={{ mr: 1, color: '#3f51b5' }} />
              <Typography 
                variant={isMobile ? "body1" : "h6"} 
                component={Link} 
                to="/" 
                sx={{ 
                  textDecoration: 'none',
                  color: 'white',
                  fontWeight: 700,
                  letterSpacing: 0.5
                }}
              >
                Card Creator
              </Typography>
            </Box>
            
            {/* Navigation Links */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                color="inherit" 
                component={Link}
                to="/"
                startIcon={!isMobile && <HomeIcon />}
                sx={{ 
                  ml: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  display: location.pathname === '/' ? 'none' : 'flex'
                }}
              >
                {isMobile ? <HomeIcon /> : "Home"}
              </Button>

              <Button 
                color="inherit" 
                component={Link}
                to="/cards"
                startIcon={!isMobile && <ViewListIcon />}
                sx={{ 
                  ml: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  display: location.pathname === '/cards' ? 'none' : 'flex'
                }}
              >
                {isMobile ? <ViewListIcon /> : "My Cards"}
              </Button>
              
              <Button 
                color="inherit" 
                component={Link}
                to="/edit"
                startIcon={!isMobile && <AddIcon />}
                sx={{ 
                  ml: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  display: location.pathname === '/edit' ? 'none' : 'flex'
                }}
              >
                {isMobile ? <AddIcon /> : "Create Card"}
              </Button>
              
              {/* GitHub link - can be changed to your actual repo */}
              <IconButton 
                color="inherit" 
                sx={{ ml: 1 }}
                component="a"
                href="https://github.com/your-repo/card-creator"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
      
      {/* Simple Footer */}
      <Box 
        component="footer"
        sx={{ 
          py: 3, 
          mt: 'auto', 
          bgcolor: '#f5f5f5',
          borderTop: '1px solid #e0e0e0'
        }}
      >
        <Container maxWidth="lg">
          <Typography 
            variant="body2" 
            color="text.secondary" 
            align="center"
          >
            © {new Date().getFullYear()} Card Creator | Create and Share Digital Profile Cards
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
