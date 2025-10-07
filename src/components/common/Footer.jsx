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
        bgcolor: 'grey.900',
        color: 'white',
        py: 6,
        mt: 'auto',
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
              <IconButton color="inherit" aria-label="Facebook">
                <Facebook />
              </IconButton>
              <IconButton color="inherit" aria-label="Twitter">
                <Twitter />
              </IconButton>
              <IconButton color="inherit" aria-label="Instagram">
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
              <Email sx={{ mr: 1, fontSize: 'small' }} />
              <Typography variant="body2">{t('footer.email')}</Typography>
            </Box>
            <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
              <Phone sx={{ mr: 1, fontSize: 'small' }} />
              <Typography variant="body2">{t('footer.phone')}</Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <LocationOn sx={{ mr: 1, fontSize: 'small' }} />
              <Typography variant="body2">{t('footer.address')}</Typography>
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