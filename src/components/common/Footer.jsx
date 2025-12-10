import React from 'react';
import { useTranslations } from '../../hooks/useTranslations'; // ⭐ Usar nuestro hook
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
} from '@mui/material';
import {
  Facebook,
  Twitter,
  Instagram,
  Email,
  Phone,
  LocationOn,
} from '@mui/icons-material';

const Footer = () => {
  const { t, translateService } = useTranslations(); // ⭐ Usar nuestro hook

  return (
    <Box
      component="footer"
      sx={{
        // FORZAR colores para prevenir tema oscuro
        bgcolor: '#1F2937 !important',
        backgroundColor: '#1F2937 !important',
        color: 'white !important',
        py: 6,
        mt: 'auto',
        colorScheme: 'light',
        WebkitColorScheme: 'light',
      }}
      style={{
        // Estilos inline como backup
        backgroundColor: '#1F2937',
        color: 'white',
        colorScheme: 'light',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="h6" gutterBottom>
              ChambingApp
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {t('footer.description')}
            </Typography>
            <Box>
              <IconButton
                color="inherit"
                aria-label="Facebook"
                sx={{
                  color: 'white !important',
                  '& svg': {
                    color: 'white !important',
                    fill: 'white !important',
                    filter: 'none !important'
                  }
                }}
              >
                <Facebook />
              </IconButton>
              <IconButton
                color="inherit"
                aria-label="Twitter"
                sx={{
                  color: 'white !important',
                  '& svg': {
                    color: 'white !important',
                    fill: 'white !important',
                    filter: 'none !important'
                  }
                }}
              >
                <Twitter />
              </IconButton>
              <IconButton
                color="inherit"
                aria-label="Instagram"
                sx={{
                  color: 'white !important',
                  '& svg': {
                    color: 'white !important',
                    fill: 'white !important',
                    filter: 'none !important'
                  }
                }}
              >
                <Instagram />
              </IconButton>
            </Box>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('footer.services')}
            </Typography>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              {translateService('domesticCleaning')}
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              {translateService('plumbing')}
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              {translateService('electricity')}
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              {translateService('gardening')}
            </Link>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('footer.company')}
            </Typography>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              {t('footer.about')}
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              {t('footer.terms')}
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              {t('footer.privacy')}
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              {t('footer.help')}
            </Link>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('footer.contact')}
            </Typography>
            <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
              <Email
                sx={{
                  mr: 1,
                  fontSize: 'small',
                  color: 'white !important',
                  fill: 'white !important',
                  filter: 'none !important'
                }}
              />
              <Typography variant="body2" sx={{ color: 'white !important' }}>
                {t('footer.email')}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
              <Phone
                sx={{
                  mr: 1,
                  fontSize: 'small',
                  color: 'white !important',
                  fill: 'white !important',
                  filter: 'none !important'
                }}
              />
              <Typography variant="body2" sx={{ color: 'white !important' }}>
                {t('footer.phone')}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <LocationOn
                sx={{
                  mr: 1,
                  fontSize: 'small',
                  color: 'white !important',
                  fill: 'white !important',
                  filter: 'none !important'
                }}
              />
              <Typography variant="body2" sx={{ color: 'white !important' }}>
                {t('footer.address')}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Box
          sx={{
            borderTop: 1,
            borderColor: 'grey.700',
            pt: 3,
            mt: 4,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="grey.400">
            {t('footer.rights')}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;