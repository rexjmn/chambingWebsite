# ESPECIFICACIÓN DEL BACKEND - SISTEMA DE RESEÑAS

**Fecha:** 31 de Diciembre 2025
**Proyecto:** ChambingApp - Sistema de Reviews
**Framework:** NestJS + TypeORM + PostgreSQL

---

## 📋 TABLA DE CONTENIDOS

1. [Modelo de Datos](#modelo-de-datos)
2. [Endpoints Required](#endpoints-required)
3. [Validaciones](#validaciones)
4. [Lógica de Negocio](#lógica-de-negocio)
5. [Ejemplo de Implementación](#ejemplo-de-implementación)

---

## 1. MODELO DE DATOS

### Tabla: `reviews`

```sql
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,

  -- Relaciones
  contrato_id INTEGER NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  trabajador_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cliente_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Datos de la reseña
  calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  comentario TEXT NOT NULL CHECK (LENGTH(TRIM(comentario)) >= 10),

  -- Metadatos
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_review_per_contract UNIQUE(contrato_id),
  CONSTRAINT check_calificacion_range CHECK (calificacion BETWEEN 1 AND 5),
  CONSTRAINT check_comentario_length CHECK (LENGTH(TRIM(comentario)) >= 10 AND LENGTH(comentario) <= 500)
);

-- Índices para optimizar consultas
CREATE INDEX idx_reviews_trabajador ON reviews(trabajador_id);
CREATE INDEX idx_reviews_cliente ON reviews(cliente_id);
CREATE INDEX idx_reviews_contrato ON reviews(contrato_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
```

### Entity TypeORM (reviews.entity.ts)

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Contrato } from '../contracts/entities/contrato.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'contrato_id' })
  contratoId: number;

  @ManyToOne(() => Contrato, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contrato_id' })
  contrato: Contrato;

  @Column({ name: 'trabajador_id' })
  trabajadorId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trabajador_id' })
  trabajador: User;

  @Column({ name: 'cliente_id' })
  clienteId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cliente_id' })
  cliente: User;

  @Column({ type: 'integer' })
  calificacion: number;

  @Column({ type: 'text' })
  comentario: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

---

## 2. ENDPOINTS REQUIRED

### 2.1. Crear Reseña
```
POST /reviews
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "contrato_id": 123,
  "trabajador_id": 456,
  "calificacion": 5,
  "comentario": "Excelente trabajo, muy profesional y puntual."
}

Response 201:
{
  "status": "success",
  "message": "Reseña creada exitosamente",
  "data": {
    "id": 1,
    "contrato_id": 123,
    "trabajador_id": 456,
    "cliente_id": 789,
    "calificacion": 5,
    "comentario": "Excelente trabajo, muy profesional y puntual.",
    "created_at": "2025-12-31T10:00:00Z"
  }
}

Errors:
- 400: Validación fallida
- 401: No autenticado
- 403: No autorizado (no eres el cliente del contrato)
- 404: Contrato no encontrado
- 409: Ya existe una reseña para este contrato
```

### 2.2. Obtener Reseñas de un Trabajador
```
GET /users/:userId/reviews
Authorization: No requerida (endpoint público)

Query Parameters:
- limit: number (default: 10)
- offset: number (default: 0)
- sort: 'newest' | 'highest' | 'lowest' (default: 'newest')

Response 200:
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "calificacion": 5,
      "comentario": "Excelente trabajo...",
      "cliente_nombre": "Juan Pérez",
      "fecha": "2025-12-31T10:00:00Z"
    }
  ],
  "meta": {
    "total": 25,
    "limit": 10,
    "offset": 0
  }
}
```

### 2.3. Obtener Estadísticas de un Trabajador
```
GET /users/:userId/stats
Authorization: No requerida (endpoint público)

Response 200:
{
  "status": "success",
  "data": {
    "rating": 4.8,
    "total_reviews": 25,
    "trabajos_completados": 30,
    "rating_distribution": {
      "5": 20,
      "4": 3,
      "3": 2,
      "2": 0,
      "1": 0
    }
  }
}
```

### 2.4. Verificar si un Contrato tiene Reseña
```
GET /contracts/:contractId/review
Authorization: Bearer <token>

Response 200 (tiene reseña):
{
  "status": "success",
  "data": {
    "hasReview": true,
    "review": {
      "id": 1,
      "calificacion": 5,
      "comentario": "Excelente trabajo...",
      "created_at": "2025-12-31T10:00:00Z"
    }
  }
}

Response 404 (no tiene reseña):
{
  "status": "success",
  "data": {
    "hasReview": false,
    "review": null
  }
}
```

### 2.5. Actualizar Reseña (Opcional)
```
PUT /reviews/:reviewId
Authorization: Bearer <token>

Body:
{
  "calificacion": 4,
  "comentario": "Actualización del comentario..."
}

Response 200:
{
  "status": "success",
  "message": "Reseña actualizada exitosamente",
  "data": { /* review actualizada */ }
}

Errors:
- 403: Solo el autor puede editar su reseña
- 404: Reseña no encontrada
```

### 2.6. Eliminar Reseña (Opcional - Solo Admin)
```
DELETE /reviews/:reviewId
Authorization: Bearer <token> (requiere rol admin)

Response 200:
{
  "status": "success",
  "message": "Reseña eliminada exitosamente"
}
```

---

## 3. VALIDACIONES

### DTO para Crear Reseña (create-review.dto.ts)

```typescript
import { IsInt, IsString, Min, Max, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsInt()
  @Type(() => Number)
  contrato_id: number;

  @IsInt()
  @Type(() => Number)
  trabajador_id: number;

  @IsInt()
  @Min(1, { message: 'La calificación mínima es 1 estrella' })
  @Max(5, { message: 'La calificación máxima es 5 estrellas' })
  @Type(() => Number)
  calificacion: number;

  @IsString()
  @MinLength(10, { message: 'El comentario debe tener al menos 10 caracteres' })
  @MaxLength(500, { message: 'El comentario no puede exceder 500 caracteres' })
  comentario: string;
}
```

---

## 4. LÓGICA DE NEGOCIO

### Reglas de Negocio para Crear Reseña:

1. **Autenticación**: El usuario debe estar autenticado
2. **Contrato Cerrado**: Solo se pueden dejar reseñas en contratos con estado 'cerrado'
3. **Autorización**: Solo el CLIENTE del contrato puede dejar reseña
4. **Una Reseña por Contrato**: No se permiten reseñas duplicadas
5. **Validación de Datos**:
   - Calificación: 1-5 estrellas
   - Comentario: 10-500 caracteres
   - Texto sin HTML/scripts (sanitizar)
6. **Trabajador Válido**: El trabajador debe existir y ser tipo 'trabajador'

### Ejemplo de Validación en el Service:

```typescript
async createReview(createReviewDto: CreateReviewDto, clienteId: number) {
  const { contrato_id, trabajador_id, calificacion, comentario } = createReviewDto;

  // 1. Verificar que el contrato existe
  const contrato = await this.contratoRepository.findOne({
    where: { id: contrato_id },
    relations: ['empleador', 'trabajador']
  });

  if (!contrato) {
    throw new NotFoundException('Contrato no encontrado');
  }

  // 2. Verificar que el contrato está cerrado
  if (contrato.estado !== 'cerrado') {
    throw new BadRequestException('Solo puedes dejar reseñas en contratos cerrados');
  }

  // 3. Verificar que el usuario es el cliente del contrato
  if (contrato.empleador.id !== clienteId) {
    throw new ForbiddenException('Solo el cliente del contrato puede dejar una reseña');
  }

  // 4. Verificar que no existe ya una reseña
  const existingReview = await this.reviewRepository.findOne({
    where: { contrato_id }
  });

  if (existingReview) {
    throw new ConflictException('Ya existe una reseña para este contrato');
  }

  // 5. Verificar que el trabajador es correcto
  if (contrato.trabajador.id !== trabajador_id) {
    throw new BadRequestException('El trabajador no coincide con el contrato');
  }

  // 6. Sanitizar comentario
  const sanitizedComentario = this.sanitizeText(comentario);

  // 7. Crear la reseña
  const review = this.reviewRepository.create({
    contratoId: contrato_id,
    trabajadorId: trabajador_id,
    clienteId: clienteId,
    calificacion,
    comentario: sanitizedComentario
  });

  await this.reviewRepository.save(review);

  // 8. Actualizar estadísticas del trabajador (opcional, puede ser async)
  await this.updateWorkerStats(trabajador_id);

  return review;
}
```

### Actualizar Estadísticas del Trabajador:

```typescript
async updateWorkerStats(trabajadorId: number) {
  const stats = await this.reviewRepository
    .createQueryBuilder('review')
    .select('AVG(review.calificacion)', 'rating')
    .addSelect('COUNT(review.id)', 'total_reviews')
    .where('review.trabajador_id = :trabajadorId', { trabajadorId })
    .getRawOne();

  // Actualizar en la tabla de usuarios o tabla de stats
  await this.userRepository.update(trabajadorId, {
    rating: parseFloat(stats.rating) || 0,
    total_reviews: parseInt(stats.total_reviews) || 0
  });
}
```

---

## 5. EJEMPLO DE IMPLEMENTACIÓN

### Estructura de Archivos:

```
src/
├── reviews/
│   ├── dto/
│   │   ├── create-review.dto.ts
│   │   └── update-review.dto.ts
│   ├── entities/
│   │   └── review.entity.ts
│   ├── reviews.controller.ts
│   ├── reviews.service.ts
│   └── reviews.module.ts
```

### Controller Básico (reviews.controller.ts):

```typescript
import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createReviewDto: CreateReviewDto, @Request() req) {
    return this.reviewsService.create(createReviewDto, req.user.id);
  }
}

@Controller('users')
export class UsersController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':userId/reviews')
  async getUserReviews(@Param('userId') userId: string) {
    return this.reviewsService.findByWorker(+userId);
  }

  @Get(':userId/stats')
  async getUserStats(@Param('userId') userId: string) {
    return this.reviewsService.getWorkerStats(+userId);
  }
}

@Controller('contracts')
export class ContractsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':contractId/review')
  @UseGuards(JwtAuthGuard)
  async getContractReview(@Param('contractId') contractId: string) {
    return this.reviewsService.findByContract(+contractId);
  }
}
```

---

## 📌 CHECKLIST DE IMPLEMENTACIÓN

### Backend (NestJS):
- [ ] Crear migración de base de datos para tabla `reviews`
- [ ] Crear entity `Review`
- [ ] Crear DTOs (CreateReviewDto, UpdateReviewDto)
- [ ] Crear ReviewsService con métodos CRUD
- [ ] Crear ReviewsController con endpoints
- [ ] Agregar columnas `rating` y `total_reviews` a tabla `users`
- [ ] Implementar lógica de actualización de estadísticas
- [ ] Agregar validaciones y reglas de negocio
- [ ] Crear tests unitarios e integración
- [ ] Documentar endpoints en Swagger

### Frontend (React):
- [x] Crear `reviewService.js`
- [x] Crear componente `ReviewForm`
- [x] Crear componente `ReviewModal`
- [x] Agregar traducciones
- [ ] Integrar con `ContractDetails`
- [ ] Agregar botón "Dejar Reseña" después de cerrar contrato
- [ ] Mostrar reseñas en perfiles públicos
- [ ] Agregar tests para componentes

---

## 🚀 DEPLOYMENT

1. Ejecutar migración en base de datos
2. Deployar backend con nuevos endpoints
3. Deployar frontend con nuevos componentes
4. Verificar funcionamiento end-to-end
5. Monitorear errores en producción

---

**Siguiente paso:** Implementar el backend según esta especificación.
