import React, { useState } from 'react';
import { 
  Box, 
  Button,
  Grid, 
  Typography,
  Popover
} from '@mui/material';

// Predefined Material UI color palette with more faint, higher opacity colors
const defaultColors = [
  '#ffffff', // white
  '#fdfcfc', // very faint off-white
  '#fbfbfb', // fainter off-white
  '#f9f9f9', // barely off-white
  '#f8fafe', // ultra faint blue
  '#f9fcf6', // ultra faint mint
  '#f7fdff', // ultra faint cyan
  '#fafbfc', // pale neutral
  '#fcfcf9', // ultra faint cream
  '#fafafa', // very light gray
  '#f7f8fa', // very faint blue-gray
  '#f9f8fc', // ultra faint lavender
  '#f8fcfc', // ultra faint teal
  '#fdf9fb', // ultra faint pink
  '#212121'  // keep dark gray unchanged
];

// Vibrant colors for photo outlines to make images pop
const outlineColors = [
  'transparent', // transparent (no outline)
  '#000000', // black (default)
  '#d2e961', // lime green
  '#61e9a8', // mint green
  '#61c3e9', // sky blue
  '#61a8e9', // blue
  '#8861e9', // purple
  '#e961d2', // pink
  '#e96161', // red
  '#e9a861', // orange
  '#eadf61', // yellow
  '#2ee37d', // vibrant green
  '#2ecae3', // turquoise
  '#2e7ae3', // royal blue
  '#7a2ee3', // violet
  '#e32eae', // magenta
];

const ColorPicker = ({ color, onChange, colorType = 'default' }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  // Select color palette based on colorType
  const colors = colorType === 'outline' ? outlineColors : defaultColors;

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleColorChange = (selectedColor) => {
    onChange(selectedColor);
    handleClose();
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Button 
          onClick={handleClick}
          variant="outlined"
          sx={{ 
            minWidth: '28px', 
            minHeight: '28px',
            width: '28px',
            height: '28px',
            p: 0,
            mr: 2,
            backgroundColor: color,
            border: '1px solid #f0f0f0',
            outline: color !== '#ffffff' && color !== '#212121' ? `1px solid ${color}` : 'none',
            borderRadius: '6px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            '&:hover': {
              backgroundColor: color,
              borderColor: '#ddd',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }
          }}
          aria-label="Choose theme"
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
          sx: { borderRadius: '8px', border: '1px solid #f0f0f0' }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ mb: 1.5, opacity: 0.6, fontSize: '0.85rem', fontWeight: 400 }}>
            {colorType === 'outline' ? 'Select outline (or none)' : 'Select subtle background'}
          </Typography>
          <Grid container spacing={1.5} sx={{ width: 240 }}>
            {(colorType === 'outline' ? outlineColors : defaultColors).map((colorOption) => (
              <Grid item key={colorOption} xs={3}>
                <Button
                  sx={{
                    minWidth: '36px',
                    minHeight: '36px',
                    width: '36px',
                    height: '36px',
                    p: 0,
                    backgroundColor: colorOption === 'transparent' ? 'white' : colorOption,
                    border: color === colorOption ? '2px solid #999' : '1px solid #eee',
                    borderRadius: '6px',
                    outline: colorOption !== '#ffffff' && colorOption !== '#212121' && colorOption !== 'transparent' ? `1px solid ${colorOption}` : 'none',
                    boxShadow: color === colorOption ? '0 0 0 2px rgba(0,0,0,0.03)' : 'none',
                    opacity: colorOption !== '#212121' ? 1 : 1, // Keep black at full opacity
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: colorOption === 'transparent' ? 'white' : colorOption,
                      borderColor: '#bbb',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    },
                    '&::before': colorOption === 'transparent' ? {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '24px',
                      height: '24px',
                      border: '2px dashed #ccc',
                      borderRadius: '50%',
                      backgroundColor: 'transparent',
                    } : {},
                    '&::after': colorOption === 'transparent' ? {
                      content: '""',
                      position: 'absolute',
                      top: '7px',
                      right: '7px',
                      width: '20px',
                      height: '2px',
                      backgroundColor: '#ff5252',
                      transform: 'rotate(45deg)',
                    } : {},
                  }}
                  onClick={() => handleColorChange(colorOption)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Popover>
    </>
  );
};

export default ColorPicker;
