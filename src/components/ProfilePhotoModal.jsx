import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Avatar,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Slider,
  Stack,
} from '@mui/material';
import {
  PhotoCamera,
  AccountCircle,
  Close,
  ZoomIn,
  ZoomOut,
  RotateLeft,
} from '@mui/icons-material';
import Cropper from 'react-easy-crop';
import { useAuth } from '../context/AuthContext';

const ProfilePhotoModal = ({ open, onClose, onPhotoUpdated }) => {
  const { user, updateUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Solo se permiten archivos JPG, PNG o WebP');
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo no puede ser mayor a 5MB');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Crear preview con FileReader
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target.result);
      // Reset crop settings
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    };
    reader.readAsDataURL(file);
  };

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x,
      0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setUploading(true);
    setError(null);

    try {
      // Crear imagen recortada
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      
      // Crear FormData con la imagen recortada
      const formData = new FormData();
      formData.append('file', croppedBlob, selectedFile.name);

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/users/profile-photo`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir la foto');
      }

      const result = await response.json();
      
      // Actualizar el usuario en el contexto
      if (updateUser) {
        updateUser({
          ...user,
          foto_perfil: result.data.foto_perfil
        });
      }

      // Llamar callback si existe
      if (onPhotoUpdated) {
        onPhotoUpdated(result.data.foto_perfil);
      }

      // Cerrar modal
      handleClose();
      
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError(error.message || 'Error al subir la foto');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setError(null);
    setUploading(false);
    onClose();
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Cambiar Foto de Perfil
          </Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box display="flex" flexDirection="column" py={2}>
          {!imageSrc ? (
            // Vista sin imagen seleccionada
            <Box textAlign="center" py={4}>
              <Box position="relative" display="inline-block" mb={3}>
                <Avatar
                  src={user?.foto_perfil}
                  sx={{ 
                    width: 120, 
                    height: 120,
                    margin: '0 auto',
                  }}
                >
                  {!user?.foto_perfil && (user?.nombre?.charAt(0) || <AccountCircle />)}
                </Avatar>
                
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    position: 'absolute',
                    bottom: -8,
                    right: -8,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                >
                  <PhotoCamera />
                </IconButton>
              </Box>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Haz clic en el icono de la cámara para seleccionar una foto.
                <br />
                Formatos permitidos: JPG, PNG, WebP (máximo 5MB)
              </Typography>
            </Box>
          ) : (
            // Vista con editor de recorte
            <>
              {/* Área de recorte */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 400,
                  bgcolor: 'grey.900',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </Box>

              {/* Controles */}
              <Box sx={{ mt: 3 }}>
                <Stack spacing={2}>
                  {/* Control de zoom */}
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Zoom
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <ZoomOut fontSize="small" />
                      <Slider
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        onChange={(e, value) => setZoom(value)}
                        sx={{ flexGrow: 1 }}
                      />
                      <ZoomIn fontSize="small" />
                    </Stack>
                  </Box>

                  {/* Botón de rotación */}
                  <Box>
                    <Button
                      startIcon={<RotateLeft />}
                      onClick={handleRotate}
                      variant="outlined"
                      size="small"
                    >
                      Rotar 90°
                    </Button>
                  </Box>

                  {/* Botón para cambiar imagen */}
                  <Box>
                    <Button
                      startIcon={<PhotoCamera />}
                      onClick={() => fileInputRef.current?.click()}
                      variant="outlined"
                      size="small"
                      fullWidth
                    >
                      Seleccionar otra imagen
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </Box>
                </Stack>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Arrastra para reposicionar, usa el zoom para ajustar el tamaño
              </Typography>
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          Cancelar
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!imageSrc || uploading}
          startIcon={uploading ? <CircularProgress size={20} /> : null}
        >
          {uploading ? 'Subiendo...' : 'Guardar Foto'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfilePhotoModal;