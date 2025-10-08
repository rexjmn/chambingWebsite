import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations'; // ⭐ Usar nuestro hook
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  Paper,
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Lock,
  Login as LoginIcon 
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const LoginForm = () => {
  const { t, common } = useTranslations(); // ⭐ Usar nuestro hook
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';
  const message = location.state?.message;

  // ⭐ Schema de validación con traducciones dinámicas
  const schema = yup.object().shape({
    email: yup
      .string()
      .email(t('auth.validation.emailInvalid'))
      .required(t('auth.validation.required')),
    password: yup
      .string()
      .required(t('auth.validation.required')),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  
  const onSubmit = async (data) => {
    try {
      console.log('🚀 Intentando login con:', { email: data.email });
      await login(data);
      console.log('✅ Login exitoso, redirigiendo a:', from);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('❌ Error en login:', error);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={3}>
            <LoginIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              {t('auth.login.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('auth.login.subtitle')}
            </Typography>
          </Box>
          
          {message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* ⭐ Botones de datos de prueba traducidos */}
          <Paper 
            elevation={0} 
            sx={{ 
              bgcolor: 'grey.50', 
              p: 2, 
              mb: 3, 
              borderRadius: 2 
            }}
          >
          </Paper>

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              {...register('email')}
              fullWidth
              label={t('auth.login.email')}
              type="email"
              error={!!errors.email}
              helperText={errors.email?.message}
              margin="normal"
              autoComplete="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              {...register('password')}
              fullWidth
              label={t('auth.login.password')}
              type={showPassword ? 'text' : 'password'}
              error={!!errors.password}
              helperText={errors.password?.message}
              margin="normal"
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label="toggle password visibility"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? t('auth.login.loginButtonLoading') : t('auth.login.loginButton')}
            </Button>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {common.or}
              </Typography>
            </Divider>

            <Box textAlign="center">
              <Typography variant="body2">
                {t('auth.login.noAccount')}{' '}
                <Link 
                  to="/register" 
                  style={{ 
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    color: '#2563eb'
                  }}
                >
                  {t('auth.login.registerHere')}
                </Link>
              </Typography>
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* ⭐ Info de debugging traducida */}
      <Paper
        elevation={1}
        sx={{
          mt: 3,
          p: 2,
          bgcolor: 'info.light',
          color: 'info.contrastText',
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          🔧 {t('common.debugInfo')}:
        </Typography>
        <Typography variant="caption" component="div">
          API URL: {import.meta.env.VITE_API_URL || 'http://localhost:3000'}
        </Typography>
        <Typography variant="caption" component="div">
          {t('common.mode')}: {import.meta.env.MODE}
        </Typography>
        <Typography variant="caption" component="div">
          Backend debe estar corriendo en: http://localhost:3000
        </Typography>
      </Paper>
    </Container>
  );
};

export default LoginForm;