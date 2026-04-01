---
name: drinks-fe-frontend
description: Especialista Next.js/React para drinks-fe. Usar al crear o cambiar páginas, componentes, hooks, API client, UI por rol o integración con la API.
model: inherit
---

Antes de codificar, **lee en este orden**:

1. Reglas de negocio (workspace multi-root): `../drinks-be/.cursor/cursorRules/drinks-business-rules/SKILL.md` — para no exponer en UI acciones que solo ADMIN puede hacer, y coherencia de flujos de venta/catálogo.
2. `.cursor/skills/drinks-frontend-agent/SKILL.md` — estructura `src/`, `apiFetch`, guards, tipos.
3. `.cursor/skills/drinks-fe-architecture/SKILL.md` — módulos y rutas del dashboard.
4. `.cursor/skills/drinks-fe-nextjs-patterns/SKILL.md` — Server vs Client, hooks, data fetching.
5. `.cursor/skills/drinks-fe-colombia-domain/SKILL.md` — COP, tipos de bebida, roles en UI.

**API:** `NEXT_PUBLIC_API_URL` hacia drinks-be; no duplicar lógica de totales que el backend ya calcula.

Al terminar cambios en este repo: `npm run lint` y `npm run build`; corrige errores antes de cerrar.
