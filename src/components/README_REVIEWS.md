# 🌟 Sistema de Reseñas - Guía de Uso

## 📦 Componentes Disponibles

### 1. ReviewForm
Formulario para dejar reseñas.

```jsx
import ReviewForm from '../components/ReviewForm';

<ReviewForm
  contratoId="123"
  trabajadorId="456"
  trabajadorNombre="Juan Pérez"
  onSuccess={() => console.log('Reseña enviada!')}
  onCancel={() => console.log('Cancelado')}
  onClose={() => setShowForm(false)}
/>
```

### 2. ReviewModal
Modal wrapper del formulario.

```jsx
import ReviewModal from '../components/ReviewModal';

<ReviewModal
  isOpen={showModal}
  contratoId="123"
  trabajadorId="456"
  trabajadorNombre="Juan Pérez"
  onSuccess={handleSuccess}
  onClose={() => setShowModal(false)}
  canSkip={true}
/>
```

### 3. reviewService
Servicio de API para reseñas.

```jsx
import { reviewService } from '../services/reviewService';

// Crear reseña
await reviewService.createReview({
  contratoId: '123',
  trabajadorId: '456',
  calificacion: 5,
  comentario: 'Excelente trabajo!'
});

// Obtener reseñas de un trabajador
const reviews = await reviewService.getWorkerReviews('456');

// Obtener estadísticas
const stats = await reviewService.getWorkerStats('456');

// Verificar si existe reseña
const hasReview = await reviewService.hasReview('123');
```

---

## 🎯 Ejemplo Completo: Integración con ContractDetails

```jsx
import React, { useState } from 'react';
import ReviewModal from '../components/ReviewModal';
import { contractService } from '../services/contractService';

const ContractDetails = () => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [contract, setContract] = useState(null);

  const handleCerrarContrato = async () => {
    try {
      // Cerrar el contrato
      await contractService.cerrarContrato(contract.id);

      // Mostrar modal de reseña
      setShowReviewModal(true);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleReviewSuccess = () => {
    setShowReviewModal(false);
    // Opcional: Mostrar mensaje de éxito
    alert('¡Gracias por tu reseña!');
    // Recargar datos del contrato
    loadContract();
  };

  return (
    <div>
      {/* ... UI del contrato ... */}

      {contract?.estado === 'completado' && (
        <button onClick={handleCerrarContrato}>
          Cerrar Contrato y Liberar Pago
        </button>
      )}

      {/* Modal de Reseña */}
      <ReviewModal
        isOpen={showReviewModal}
        contratoId={contract?.id}
        trabajadorId={contract?.trabajador?.id}
        trabajadorNombre={contract?.trabajador?.nombre}
        onSuccess={handleReviewSuccess}
        onClose={() => setShowReviewModal(false)}
        canSkip={true}
      />
    </div>
  );
};
```

---

## 🎨 Estilos Personalizados

Si necesitas personalizar los estilos:

```scss
// Sobreescribir colores
.review-form-container {
  --primary-color: #your-color;
  --star-color: #your-star-color;
}

// Cambiar tamaño de estrellas
.star-button .star-icon {
  font-size: 48px !important;  // Default: 36px
}

// Personalizar botones
.btn-submit {
  background: linear-gradient(45deg, #your-color-1, #your-color-2);
}
```

---

## 🔔 Manejo de Errores

```jsx
import { reviewService } from '../services/reviewService';

try {
  await reviewService.createReview(data);
} catch (error) {
  if (error.response?.status === 409) {
    // Ya existe una reseña
    alert('Ya dejaste una reseña para este contrato');
  } else if (error.response?.status === 403) {
    // No autorizado
    alert('No puedes dejar reseña en este contrato');
  } else {
    // Error genérico
    alert('Error al enviar reseña. Intenta de nuevo.');
  }
}
```

---

## 📊 Mostrar Reseñas en Perfil

```jsx
import React, { useEffect, useState } from 'react';
import { reviewService } from '../services/reviewService';

const WorkerProfile = ({ workerId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const [reviewsData, statsData] = await Promise.all([
        reviewService.getWorkerReviews(workerId),
        reviewService.getWorkerStats(workerId)
      ]);

      setReviews(reviewsData.data || []);
      setStats(statsData.data || {});
    };

    loadData();
  }, [workerId]);

  return (
    <div>
      {/* Estadísticas */}
      <div>
        <h3>Rating: {stats?.rating?.toFixed(1)} ⭐</h3>
        <p>{stats?.total_reviews} reseñas</p>
      </div>

      {/* Lista de Reseñas */}
      {reviews.map(review => (
        <div key={review.id}>
          <div>{'⭐'.repeat(review.calificacion)}</div>
          <p>{review.comentario}</p>
          <small>{review.cliente_nombre} - {review.fecha}</small>
        </div>
      ))}
    </div>
  );
};
```

---

## ✅ Checklist de Integración

Cuando integres el sistema de reseñas:

- [ ] Importar `ReviewModal` en tu componente
- [ ] Agregar estado `showReviewModal`
- [ ] Llamar a modal después de cerrar contrato
- [ ] Manejar callbacks `onSuccess` y `onClose`
- [ ] Verificar que traducciones estén cargadas
- [ ] Probar flujo completo en desarrollo
- [ ] Verificar que backend esté implementado
- [ ] Hacer tests de integración

---

## 🚀 Deploy Checklist

Antes de deployar:

- [ ] Backend implementado y funcionando
- [ ] Endpoints probados con Postman/Insomnia
- [ ] Traducciones EN y FR agregadas
- [ ] Tests unitarios pasando
- [ ] Tests E2E funcionando
- [ ] Error handling probado
- [ ] Performance verificada
- [ ] Accesibilidad validada

---

## 📞 Troubleshooting

### Problema: Modal no aparece
**Solución:** Verificar que `isOpen={true}` y que el z-index sea correcto.

### Problema: Estrellas no aparecen
**Solución:** Importar iconos de `@mui/icons-material`.

### Problema: Error 404 en API
**Solución:** Backend no implementado. Ver `BACKEND_REVIEWS_SPEC.md`.

### Problema: Error de CORS
**Solución:** Configurar CORS en backend NestJS.

### Problema: Traducciones no funcionan
**Solución:** Verificar que i18next esté configurado y archivo JSON sea válido.

---

## 🎓 Mejores Prácticas

1. **Siempre validar datos antes de enviar**
   ```jsx
   if (calificacion < 1 || calificacion > 5) return;
   if (comentario.length < 10) return;
   ```

2. **Manejar estados de loading**
   ```jsx
   const [loading, setLoading] = useState(false);
   if (loading) return <Spinner />;
   ```

3. **Sanitizar entrada del usuario**
   ```jsx
   const sanitized = comentario.trim().slice(0, 500);
   ```

4. **Usar try-catch para errores**
   ```jsx
   try {
     await reviewService.createReview(data);
   } catch (error) {
     handleError(error);
   }
   ```

5. **Feedback visual inmediato**
   ```jsx
   onSuccess={() => {
     toast.success('¡Reseña enviada!');
   }}
   ```

---

**¿Necesitas ayuda?** Ver documentación completa en:
- `SISTEMA_RESENAS_IMPLEMENTADO.md` - Documentación completa
- `BACKEND_REVIEWS_SPEC.md` - Especificación del backend
