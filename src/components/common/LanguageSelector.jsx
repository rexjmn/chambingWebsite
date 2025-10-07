import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { changeLanguage, getCurrentLanguage } from '../../i18n/config';

const LanguageSelector = ({ 
  variant = 'icon', // 'icon' o 'button'
  color = 'inherit',
  size = 'medium'
}) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isChanging, setIsChanging] = useState(false);
  
  const currentLanguage = getCurrentLanguage();

  // Información de los idiomas
  const languages = {
    es: { name: 'Español', nativeName: 'Español', flag: '🇪🇸' },
    en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
    fr: { name: 'Français', nativeName: 'Français', flag: '🇫🇷' },
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = async (lng) => {
    if (lng === currentLanguage || isChanging) return;
    
    setIsChanging(true);
    
    try {
      console.log(`🌐 LanguageSelector: Cambiando a ${lng}`);
      await changeLanguage(lng);
      
      // Pequeña pausa para mostrar feedback visual
      setTimeout(() => {
        setIsChanging(false);
        handleClose();
      }, 300);
      
    } catch (error) {
      console.error('❌ Error changing language:', error);
      setIsChanging(false);
    }
  };

  const getCurrentLanguageInfo = () => {
    return languages[currentLanguage] || languages.es;
  };

  const renderTrigger = () => {
    const currentLangInfo = getCurrentLanguageInfo();
    
    if (variant === 'button') {
      return (
        <Box
          onClick={handleClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: 1,
            transition: 'background-color 0.2s',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <Typography component="span" sx={{ fontSize: '1.2em' }}>
            {currentLangInfo.flag}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {currentLangInfo.nativeName}
          </Typography>
        </Box>
      );
    }
    
    // Variant 'icon' (default)
    return (
      <Tooltip title={`${t('common.language')}: ${currentLangInfo.name}`}>
        <IconButton
          onClick={handleClick}
          size={size}
          color={color}
          disabled={isChanging}
          sx={{
            position: 'relative',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          }}
        >
          <LanguageIcon />
          {/* Badge con la bandera del idioma actual */}
          <Box
            sx={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.6em',
            }}
          >
            {currentLangInfo.flag}
          </Box>
        </IconButton>
      </Tooltip>
    );
  };

  return (
    <>
      {renderTrigger()}
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 8,
          sx: {
            mt: 1,
            minWidth: 160,
            borderRadius: 2,
            '& .MuiMenuItem-root': {
              borderRadius: 1,
              margin: '2px 8px',
              transition: 'all 0.2s',
            },
          },
        }}
      >
        {Object.entries(languages).map(([lng, info]) => (
          <MenuItem
            key={lng}
            onClick={() => handleLanguageChange(lng)}
            selected={lng === currentLanguage}
            disabled={isChanging}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              py: 1,
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 'auto' }}>
              <Typography component="span" sx={{ fontSize: '1.2em' }}>
                {info.flag}
              </Typography>
            </ListItemIcon>
            
            <ListItemText>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {info.nativeName}
              </Typography>
            </ListItemText>
            
            {lng === currentLanguage && (
              <CheckIcon 
                color="primary" 
                sx={{ 
                  fontSize: '1.1em',
                  ml: 1 
                }} 
              />
            )}
          </MenuItem>
        ))}
        
        {/* Footer del menú */}
        <Box sx={{ px: 2, py: 1, borderTop: '1px solid', borderColor: 'divider', mt: 1 }}>
          <Typography variant="caption" color="text.secondary" align="center">
            {isChanging ? (
              '🔄 Cambiando...'
            ) : (
              `💡 ${getCurrentLanguageInfo().nativeName}`
            )}
          </Typography>
        </Box>
      </Menu>
    </>
  );
};

export default LanguageSelector;