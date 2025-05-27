import React from 'react';
import { 
  Avatar, 
  Box, 
  IconButton, 
  Badge, 
  Typography,
  styled
} from '@mui/material';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import DeleteIcon from '@mui/icons-material/Delete';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const AvatarUpload = ({ avatarImage, avatarBgColor = '#d2e961', onAvatarChange, onAvatarRemove }) => {
  // Handle the file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      // Maximum file size: 2MB
      const maxSize = 2 * 1024 * 1024;
      
      if (file.size > maxSize) {
        alert('Image is too large. Please select an image smaller than 2MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        onAvatarChange(reader.result);
      };
      reader.onerror = () => {
        console.error('Error reading file');
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ml: 3 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, fontSize: '12px', fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>
        Photo
      </Typography>
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          <IconButton 
            component="label" 
            sx={{ 
              width: 22, 
              height: 22, 
              bgcolor: '#f0f0f0', 
              border: '1px solid #ddd',
              '&:hover': { bgcolor: '#e0e0e0' } 
            }}
            size="small"
          >
            <AddAPhotoIcon fontSize="small" sx={{ fontSize: '14px', color: '#555' }} />
            <VisuallyHiddenInput type="file" accept="image/*" onChange={handleFileChange} />
            <Typography 
              variant="caption" 
              sx={{ 
                position: 'absolute', 
                top: '100%', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                whiteSpace: 'nowrap',
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: '#fff',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '10px',
                opacity: 0,
                transition: 'opacity 0.2s',
                '&:hover': { opacity: 1 }
              }}
            >
              Edit
            </Typography>
          </IconButton>
        }
      >          <Box sx={{
            width: 150,
            height: 150,
            borderRadius: '50%',
            backgroundColor: avatarBgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Avatar
              src={avatarImage || ''}
              alt="Profile"
              sx={{
                width: 140,
                height: 140,
                bgcolor: avatarImage ? 'transparent' : '#f5f5f5',
                border: '2px solid #fff',
              }}
            >
              {!avatarImage && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <AddAPhotoIcon sx={{ fontSize: 18, mb: 0.5, color: '#999' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>Add</Typography>
                </Box>
              )}
            </Avatar>
          </Box>
      </Badge>
      
      {avatarImage && (
        <IconButton
          size="small"
          onClick={onAvatarRemove}
          sx={{ 
            mt: 1,
            fontSize: '12px',
            color: '#666',
            '&:hover': { color: '#333' }
          }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 0.5, fontSize: '14px' }} />
          <Typography variant="caption">Remove</Typography>
        </IconButton>
      )}
    </Box>
  );
};

export default AvatarUpload;
