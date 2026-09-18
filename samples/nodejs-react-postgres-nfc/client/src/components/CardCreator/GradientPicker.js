import React, { useState } from 'react';
import { 
  Box, 
  Button,
  Grid, 
  Typography,
  Popover,
  Tabs,
  Tab
} from '@mui/material';

// Predefined gradients for card backgrounds
const gradients = [
  { 
    id: 'blue-purple',
    name: 'Blue Purple',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff'  // Text color to use with this gradient
  },
  { 
    id: 'green-blue',
    name: 'Green Blue', 
    gradient: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)',
    color: '#ffffff'
  },
  { 
    id: 'purple-pink',
    name: 'Purple Pink',
    gradient: 'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)',
    color: '#ffffff'
  },
  { 
    id: 'orange-red',
    name: 'Orange Red',
    gradient: 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)',
    color: '#ffffff'
  },
  { 
    id: 'blue-teal',
    name: 'Blue Teal',
    gradient: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
    color: '#ffffff'
  },
  { 
    id: 'yellow-orange',
    name: 'Yellow Orange',
    gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    color: '#333333'
  },
  { 
    id: 'green-teal',
    name: 'Green Teal',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    color: '#ffffff'
  },
  { 
    id: 'pink-orange',
    name: 'Pink Orange',
    gradient: 'linear-gradient(135deg, #f953c6 0%, #b91d73 100%)',
    color: '#ffffff'
  },
  { 
    id: 'blue-grey',
    name: 'Blue Grey',
    gradient: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)',
    color: '#ffffff'
  },
  { 
    id: 'purple-blue',
    name: 'Purple Blue',
    gradient: 'linear-gradient(135deg, #9d50bb 0%, #6e48aa 100%)',
    color: '#ffffff'
  },
  { 
    id: 'teal-lime',
    name: 'Teal Lime',
    gradient: 'linear-gradient(135deg, #859398 0%, #cfd9df 100%)',
    color: '#333333'
  },
  { 
    id: 'deep-purple',
    name: 'Deep Purple',
    gradient: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
    color: '#ffffff'
  }
];

// Subtle gradients that are very light and professional
const subtleGradients = [
  { 
    id: 'subtle-blue',
    name: 'Subtle Blue',
    gradient: 'linear-gradient(135deg, #f5f7fa 0%, #e4eaff 100%)',
    color: '#333333'
  },
  { 
    id: 'subtle-green',
    name: 'Subtle Green', 
    gradient: 'linear-gradient(135deg, #f8f9fa 0%, #e6f7ec 100%)',
    color: '#333333'
  },
  { 
    id: 'subtle-purple',
    name: 'Subtle Purple',
    gradient: 'linear-gradient(135deg, #f8f9fa 0%, #efe6fc 100%)',
    color: '#333333'
  },
  { 
    id: 'subtle-pink',
    name: 'Subtle Pink',
    gradient: 'linear-gradient(135deg, #f8f9fa 0%, #fce6f0 100%)',
    color: '#333333'
  },
  { 
    id: 'subtle-yellow',
    name: 'Subtle Yellow',
    gradient: 'linear-gradient(135deg, #f8f9fa 0%, #fff8e6 100%)',
    color: '#333333'
  },
  { 
    id: 'subtle-teal',
    name: 'Subtle Teal',
    gradient: 'linear-gradient(135deg, #f8f9fa 0%, #e6fcfa 100%)',
    color: '#333333'
  }
];

// Classic gradients with dark colors for professional use
const classicGradients = [
  { 
    id: 'classic-black',
    name: 'Classic Black',
    gradient: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
    color: '#ffffff'
  },
  { 
    id: 'classic-navy',
    name: 'Classic Navy', 
    gradient: 'linear-gradient(135deg, #1A2980 0%, #26D0CE 100%)',
    color: '#ffffff'
  },
  { 
    id: 'classic-burgundy',
    name: 'Classic Burgundy',
    gradient: 'linear-gradient(135deg, #4A00E0 0%, #8E2DE2 100%)',
    color: '#ffffff'
  },
  { 
    id: 'classic-forest',
    name: 'Classic Forest',
    gradient: 'linear-gradient(135deg, #134E5E 0%, #71B280 100%)',
    color: '#ffffff'
  }
];

const GradientPicker = ({ gradient, onSelect }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const open = Boolean(anchorEl);
  
  // Determine which array to use based on tab selection
  const getGradientList = () => {
    switch(tabValue) {
      case 0:
        return subtleGradients;
      case 1:
        return gradients;
      case 2:
        return classicGradients;
      default:
        return subtleGradients;
    }
  };
  
  // Handle opening the popover
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle closing the popover
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle gradient selection
  const handleGradientChange = (selectedGradient) => {
    onSelect(selectedGradient);
    handleClose();
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Find the current gradient object
  const findCurrentGradient = () => {
    if (!gradient) return null;
    
    // Search in all gradient arrays
    const allGradients = [...subtleGradients, ...gradients, ...classicGradients];
    return allGradients.find(g => g.id === gradient.id) || null;
  };
  
  const currentGradient = findCurrentGradient() || subtleGradients[0];

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Button 
          onClick={handleClick}
          variant="outlined"
          sx={{ 
            minWidth: '28px', 
            minHeight: '28px',
            width: '64px',
            height: '28px',
            p: 0,
            mr: 2,
            background: currentGradient.gradient,
            border: '1px solid #f0f0f0',
            borderRadius: '6px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            '&:hover': {
              borderColor: '#ddd',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }
          }}
          aria-label="Choose gradient"
        >
          &nbsp;
        </Button>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          elevation: 1,
          sx: { borderRadius: '8px', border: '1px solid #f0f0f0', width: 280 }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ mb: 1, opacity: 0.8, fontSize: '0.85rem', fontWeight: 500 }}>
            Select background gradient
          </Typography>
          
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ mb: 2, borderBottom: '1px solid #f0f0f0' }}
          >
            <Tab label="Subtle" sx={{ textTransform: 'none', fontSize: '0.8rem' }}/>
            <Tab label="Vibrant" sx={{ textTransform: 'none', fontSize: '0.8rem' }}/>
            <Tab label="Classic" sx={{ textTransform: 'none', fontSize: '0.8rem' }}/>
          </Tabs>
          
          <Grid container spacing={1.5}>
            {getGradientList().map((gradientOption) => (
              <Grid item key={gradientOption.id} xs={4}>
                <Button
                  sx={{
                    minWidth: '64px',
                    minHeight: '36px',
                    width: '100%',
                    height: '36px',
                    p: 0,
                    background: gradientOption.gradient,
                    border: currentGradient.id === gradientOption.id ? '2px solid #3f51b5' : '1px solid #eee',
                    borderRadius: '6px',
                    boxShadow: currentGradient.id === gradientOption.id ? '0 0 0 2px rgba(63,81,181,0.2)' : 'none',
                    '&:hover': {
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    },
                  }}
                  onClick={() => handleGradientChange(gradientOption)}
                >
                  {currentGradient.id === gradientOption.id && (
                    <Box 
                      component="span" 
                      sx={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        backgroundColor: '#ffffff',
                        boxShadow: '0 0 0 2px rgba(63,81,181,0.8)'
                      }} 
                    />
                  )}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Popover>
    </>
  );
};

export default GradientPicker;
