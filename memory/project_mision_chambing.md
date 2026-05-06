---
name: Módulo Misión Chambing
description: Nuevo módulo de publicación y aplicación a misiones de trabajo implementado en mayo 2026
type: project
---

## Misión Chambing — Módulo completo implementado (2026-05-06)

Módulo que permite a clientes publicar anuncios de trabajo ("misiones") y a trabajadores postularse.

**Why:** Nuevo flujo inverso al modelo push de contratos: el cliente publica una necesidad, los trabajadores aplican.

**Backend** (C:\Users\rexma\Desktop\freelance-app\src\modules\misiones\):
- `entities/mision.entity.ts` — Entidad con foto_portada, cantidad_personas, salario_por_persona, duracion, notas, ManyToMany con Skill
- `entities/aplicacion-mision.entity.ts` — Postulaciones, estados: pendiente/aceptado/rechazado/retirada
- `dto/create-mision.dto.ts` y `update-mision.dto.ts`
- `misiones.service.ts` — CRUD + aplicar/retirar/getAplicaciones
- `misiones.controller.ts` — GET/POST/PATCH endpoints, foto upload con FileInterceptor
- `misiones.module.ts` — Importa SkillsModule y AwsModule
- `src/migrations/1769000000000-CreateMisionesTables.ts` — Crea tablas misiones, aplicaciones_mision, mision_habilidades

**Frontend** (chambingWebsite):
- `src/services/misionService.js` — Todos los API calls
- `src/pages/Misiones.jsx` — Listado público con paginación y búsqueda
- `src/pages/MisionDetalle.jsx` — Detalle + modal de aplicación + panel de postulantes
- `src/pages/CrearMision.jsx` — Formulario para clientes (solo tipo_usuario='cliente')
- `src/components/misiones/MisionCard.jsx` — Card distintiva (diferente a WorkerCard)
- `src/components/misiones/ApplyModal.jsx` — Popup de match de habilidades (0 matches=warn, 1-2=ok, 3+=great)
- `src/components/misiones/AplicantesPanel.jsx` — Vista del cliente con foto/titulo/stars/ver-perfil
- `src/styles/misiones.scss` — Estilos completos

**Rutas registradas:**
- `/misiones` — público
- `/misiones/crear` — protegida (clientes)  
- `/misiones/:misionId` — público
- En `app/routes.js` y `src/App.jsx`
- Navbar actualizada con "Misiones" link

**How to apply:** Cuando se toquen archivos de misiones, recordar que el `ApplyModal` usa `user.habilidades` del AuthContext para comparar con las habilidades requeridas de la misión. La migración debe correrse con `npm run migration:run` en el backend.
