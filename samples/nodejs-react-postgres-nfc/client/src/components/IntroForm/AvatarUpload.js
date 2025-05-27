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

const AvatarUpload = ({ avatarImage, avatarBgColor = '#000000', onAvatarChange, onAvatarRemove }) => {
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
  
  // Create a reference for the file input
  const fileInputRef = React.useRef(null);
  
  // Handle avatar click when no image is present
  const handleAvatarClick = () => {
    if (!avatarImage) {
      fileInputRef.current.click();
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
              width: 36, 
              height: 36, 
              bgcolor: '#f0f0f0', 
              border: '1px solid #ddd',
              '&:hover': { bgcolor: '#e0e0e0' } 
            }}
            size="medium"
          >
            <AddAPhotoIcon sx={{ fontSize: '20px', color: '#555' }} />
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
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: avatarBgColor === 'transparent' ? 'transparent' : 
                        `radial-gradient(circle, transparent 60%, ${avatarBgColor}60 85%, ${avatarBgColor}20 95%, transparent 100%)`,
            boxShadow: avatarBgColor === 'transparent' ? 'none' : 
                       `0 0 10px 2px ${avatarBgColor}70, 0 0 15px 5px ${avatarBgColor}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: !avatarImage ? 'pointer' : 'default',
          }}
          onClick={handleAvatarClick}
        >
          <Avatar
            src={avatarImage || ''}
            alt="Profile"
            sx={{
              width: 70,
              height: 70,
              bgcolor: avatarImage ? 'transparent' : '#f5f5f5',
              border: avatarBgColor === 'transparent' ? 'none' : '2px solid rgba(255,255,255,0.85)',
              cursor: !avatarImage ? 'pointer' : 'default',
            }}
          >
            {!avatarImage && (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                '&:hover': { opacity: 0.8 }
              }}>
                <AddAPhotoIcon sx={{ fontSize: 16, mb: 0.5, color: '#777' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '8px' }}>Add photo</Typography>
              </Box>
            )}
          </Avatar>
        </Box>
      </Badge>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </Box>
  );
};

export default AvatarUpload;
