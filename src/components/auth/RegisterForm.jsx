import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Tu AuthContext existente
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Grid,
  LinearProgress,
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Lock, 
  Person,
  Phone,
  LocationOn,
  PersonAdd,
  Badge,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object().shape({
  nombre: yup.string().required('Nombre es requerido'),
  apellido: yup.string().required('Apellido es requerido'),
  email: yup.string().email('Email inválido').required('Email es requerido'),
  telefono: yup.string()
    .matches(/^[0-9]{8}$/, 'El teléfono debe tener 8 dígitos')
    .required('Teléfono es requerido'),
  dui: yup.string()
    .matches(/^\d{8}-\d$/, 'El DUI debe tener el formato: 01234567-8')
    .optional(),
  departamento: yup.string().required('Departamento es requerido'),
  municipio: yup.string().required('Municipio es requerido'),
  direccion_detalle: yup.string().optional(),
  password: yup
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('Contraseña es requerida'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Las contraseñas deben coincidir')
    .required('Confirmar contraseña es requerido'),
  tipo_usuario: yup.string().oneOf(['cliente', 'trabajador']).required('Tipo de usuario es requerido'),
});

const departamentosSV = [
  'Ahuachapán', 'Cabañas', 'Chalatenango', 'Cuscatlán', 'La Libertad',
  'La Paz', 'La Unión', 'Morazán', 'San Miguel', 'San Salvador',
  'San Vicente', 'Santa Ana', 'Sonsonate', 'Usulután'
];

// Municipios por departamento (algunos ejemplos principales)
const municipiosPorDepartamento = {
  'San Salvador': [
    'San Salvador', 'Mejicanos', 'Soyapango', 'Apopa', 'Delgado', 
    'Ilopango', 'San Marcos', 'Ayutuxtepeque', 'Cuscatancingo'
  ],
  'La Libertad': [
    'Santa Tecla', 'Antiguo Cuscatlán', 'Nuevo Cuscatlán', 
    'San Juan Opico', 'Colón', 'La Libertad', 'Quezaltepeque'
  ],
  'Santa Ana': [
    'Santa Ana', 'Metapán', 'Chalchuapa', 'Candelaria de la Frontera',
    'Coatepeque', 'El Congo', 'Texistepeque'
  ],
  'San Miguel': [
    'San Miguel', 'Usulután', 'Santiago de María', 'Chinameca',
    'Nueva Guadalupe', 'San Rafael Oriente'
  ],
  'Sonsonate': [
    'Sonsonate', 'Acajutla', 'Izalco', 'Nahuizalco',
    'Sonzacate', 'Armenia', 'Caluco'
  ],
  // Agregar más según necesites o cargar dinámicamente
};

const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      tipo_usuario: 'cliente',
    },
  });

  const watchTipo = watch('tipo_usuario');
  const watchDepartamento = watch('departamento');

  // Limpiar municipio cuando cambia el departamento
  React.useEffect(() => {
    if (watchDepartamento) {
      setValue('municipio', '');
    }
  }, [watchDepartamento, setValue]);

  // Limpiar errores cuando el usuario empiece a escribir
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 8000); // Auto-limpiar después de 8 segundos

      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const onSubmit = async (data) => {
  try {
    console.log('🚀 Iniciando registro para:', data.email);
    
    // Limpiar errores previos
    clearError();
    
    // ✅ CORRECCIÓN: El backend espera campos separados, no un objeto direccion
    const { confirmPassword, direccion_detalle, ...userData } = data;
    
    const registrationData = {
      ...userData,
      // direccion como string simple (si existe)
      direccion: direccion_detalle || '',
      // departamento y municipio ya vienen en userData
    };
    
    console.log('📤 Enviando datos:', registrationData);
    
    await registerUser(registrationData);
    
    console.log('✅ Registro exitoso');
    
    navigate('/login', { 
      state: { 
        message: '¡Registro exitoso! Por favor inicia sesión con tus credenciales.',
        email: data.email
      } 
    });
  } catch (error) {
    console.error('❌ Error en registro:', error);
    // El error ya se maneja en el AuthContext
  }
};

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box textAlign="center" mb={3}>
            <PersonAdd color="primary" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Crear Cuenta
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Únete a la comunidad de ChambingApp
            </Typography>
          </Box>
          
          {/* Loading bar */}
          {loading && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress />
            </Box>
          )}
          
          {/* Error message */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Tipo de usuario */}
            <FormControl fullWidth margin="normal" error={!!errors.tipo_usuario}>
              <InputLabel>Tipo de Usuario</InputLabel>
              <Select
                {...register('tipo_usuario')}
                label="Tipo de Usuario"
                defaultValue="cliente"
              >
                <MenuItem value="cliente">
                  Cliente - Busco servicios
                </MenuItem>
                <MenuItem value="trabajador">
                  Trabajador - Ofrezco servicios
                </MenuItem>
              </Select>
              <FormHelperText>
                {errors.tipo_usuario?.message || 
                 (watchTipo === 'cliente' ? 
                   'Podrás contratar servicios domésticos y de construcción' : 
                   'Podrás ofrecer tus servicios y recibir trabajos')}
              </FormHelperText>
            </FormControl>

            {/* Información personal */}
            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
              Información Personal
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('nombre')}
                  fullWidth
                  label="Nombre"
                  error={!!errors.nombre}
                  helperText={errors.nombre?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    ),
                  }}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('apellido')}
                  fullWidth
                  label="Apellido"
                  error={!!errors.apellido}
                  helperText={errors.apellido?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    ),
                  }}
                  margin="normal"
                />
              </Grid>
            </Grid>

            {/* Email */}
            <TextField
              {...register('email')}
              fullWidth
              label="Correo Electrónico"
              type="email"
              error={!!errors.email}
              helperText={errors.email?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
              margin="normal"
            />

            <Grid container spacing={2}>
              {/* Teléfono */}
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('telefono')}
                  fullWidth
                  label="Teléfono"
                  placeholder="12345678"
                  error={!!errors.telefono}
                  helperText={errors.telefono?.message || 'Sin guiones ni espacios'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone />
                      </InputAdornment>
                    ),
                  }}
                  margin="normal"
                />
              </Grid>

              {/* DUI */}
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('dui')}
                  fullWidth
                  label="DUI (Opcional)"
                  placeholder="01234567-8"
                  error={!!errors.dui}
                  helperText={errors.dui?.message || 'Formato: 01234567-8'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Badge />
                      </InputAdornment>
                    ),
                  }}
                  margin="normal"
                />
              </Grid>
            </Grid>

            {/* Ubicación */}
            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
              Ubicación
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={!!errors.departamento}>
                  <InputLabel>Departamento</InputLabel>
                  <Select
                    {...register('departamento')}
                    label="Departamento"
                  >
                    {departamentosSV.map((dep) => (
                      <MenuItem key={dep} value={dep}>
                        {dep}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {errors.departamento?.message}
                  </FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={!!errors.municipio}>
                  <InputLabel>Municipio</InputLabel>
                  <Select
                    {...register('municipio')}
                    label="Municipio"
                    disabled={!watchDepartamento}
                  >
                    {watchDepartamento && municipiosPorDepartamento[watchDepartamento] ? 
                     municipiosPorDepartamento[watchDepartamento].map((mun) => (
                      <MenuItem key={mun} value={mun}>
                        {mun}
                      </MenuItem>
                    )) : 
                    <MenuItem value="">
                      {!watchDepartamento ? 'Selecciona un departamento primero' : 'Municipio no disponible en la lista'}
                    </MenuItem>
                    }
                  </Select>
                  <FormHelperText>
                    {errors.municipio?.message || 
                     (!watchDepartamento ? 'Selecciona primero un departamento' : '')}
                  </FormHelperText>
                </FormControl>
              </Grid>
            </Grid>

            {/* Dirección detalle */}
            <TextField
              {...register('direccion_detalle')}
              fullWidth
              label="Dirección Detallada (Opcional)"
              placeholder="Colonia, calle, número de casa, referencias..."
              multiline
              rows={2}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn />
                  </InputAdornment>
                ),
              }}
              margin="normal"
            />

            {/* Contraseñas */}
            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
              Seguridad
            </Typography>
            
            <TextField
              {...register('password')}
              fullWidth
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              margin="normal"
            />

            <TextField
              {...register('confirmPassword')}
              fullWidth
              label="Confirmar Contraseña"
              type={showConfirmPassword ? 'text' : 'password'}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              margin="normal"
            />

            {/* Información para trabajadores */}
            {watchTipo === 'trabajador' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Para trabajadores:</strong> Después del registro podrás subir tu foto de perfil 
                  desde tu perfil. La foto es obligatoria para ofrecer servicios en la plataforma.
                </Typography>
              </Alert>
            )}
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                o
              </Typography>
            </Divider>

            <Box textAlign="center">
              <Typography variant="body2">
                ¿Ya tienes cuenta?{' '}
                <Link 
                  to="/login" 
                  style={{ 
                    color: '#2563eb',
                    textDecoration: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  Inicia sesión aquí
                </Link>
              </Typography>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default RegisterForm;