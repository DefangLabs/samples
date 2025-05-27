import React from 'react';
import CardCreator from '../../components/CardCreator/CardCreator';
import { Box, Typography, Container, Paper, Divider, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import ViewListIcon from '@mui/icons-material/ViewList';

const EditPage = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 2,
            background: 'linear-gradient(45deg, #3f51b5 30%, #536dfe 90%)',
            color: 'white',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' }
          }}
        >
          <EditIcon sx={{ mr: 2, fontSize: 28 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" component="h1" fontWeight={600}>
              Create & Edit Your Card
            </Typography>
            <Typography variant="body1">
              Customize your digital profile card with your information, links, and styling preferences.
            </Typography>
          </Box>
          <Button
            component={Link}
            to="/cards"
            variant="contained"
            startIcon={<ViewListIcon />}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              color: '#3f51b5',
              '&:hover': { bgcolor: 'white' },
              ml: { xs: 0, sm: 2 },
              mt: { xs: 2, sm: 0 }
            }}
          >
            View All Cards
          </Button>
        </Paper>
        
        <Divider sx={{ mb: 4 }} />
        
        <CardCreator />
      </Box>
    </Container>
  );
};

export default EditPage;
