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

const ColorPicker = ({ color, onChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

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
        <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.7, fontSize: '0.85rem' }}>
          Background shade
        </Typography>
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
            Select subtle background
          </Typography>
          <Grid container spacing={1.5} sx={{ width: 240 }}>
            {defaultColors.map((colorOption) => (
              <Grid item key={colorOption} xs={3}>
                <Button
                  sx={{
                    minWidth: '36px',
                    minHeight: '36px',
                    width: '36px',
                    height: '36px',
                    p: 0,
                    backgroundColor: colorOption,
                    border: color === colorOption ? '2px solid #999' : '1px solid #eee',
                    borderRadius: '6px',
                    outline: colorOption !== '#ffffff' && colorOption !== '#212121' ? `1px solid ${colorOption}` : 'none',
                    boxShadow: color === colorOption ? '0 0 0 2px rgba(0,0,0,0.03)' : 'none',
                    opacity: colorOption !== '#212121' ? 1 : 1, // Keep black at full opacity
                    '&:hover': {
                      backgroundColor: colorOption,
                      borderColor: '#bbb',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    },
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
