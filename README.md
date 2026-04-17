# drinks-fe

Frontend Next.js para el billar que vende bebidas con y sin alcohol en Colombia.
Consume la API de [drinks-be](../drinks-be).

## Stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript 5** (strict mode)
- **Tailwind CSS 4**
- **ESLint + Prettier + Husky + commitlint**

## Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.template .env.local
# Editar .env.local con la URL del backend

# 3. Iniciar servidor de desarrollo
npm run dev
```

La app estará disponible en `http://localhost:3000`.

## Variables de entorno

| Variable              | Descripción                    | Default                     |
| --------------------- | ------------------------------ | --------------------------- |
| `NEXT_PUBLIC_API_URL` | URL base del backend drinks-be | `http://localhost:3001/api` |

## Comandos

| Comando          | Descripción                      |
| ---------------- | -------------------------------- |
| `npm run dev`    | Servidor de desarrollo           |
| `npm run build`  | Build de producción              |
| `npm run start`  | Servidor de producción           |
| `npm run lint`   | Linting con ESLint               |
| `npm run format` | Formatear con Prettier           |
| `npm run commit` | Commit convencional (commitlint) |

## Estructura

```
src/
├── app/
│   ├── (auth)/login/     # Módulo de autenticación
│   ├── (dashboard)/      # Rutas protegidas (requieren JWT)
│   └── layout.tsx        # Root layout
├── components/ui/        # Componentes UI reutilizables
├── hooks/                # Custom hooks
├── lib/
│   ├── api/              # API services (drinks-be)
│   ├── utils/            # Utilidades
│   └── constants.ts      # Constantes globales
├── middleware.ts          # Protección de rutas JWT
└── types/                # Tipos TypeScript globales
```

## Módulos

Los módulos se agregan en `src/app/(dashboard)/[modulo]/` y se van implementando
uno por uno según solicitud del usuario.

## Skills y reglas (Cursor / AI)

- **Reglas:** `.cursor/rules/` (Next.js, convenciones FE, SOLID/DRY).
- **Skills:** `.cursor/skills/` (frontend-agent, arquitectura, patrones, dominio Colombia).
- **Agentes:** `.cursor/agents/` — [`drinks-fe-frontend.md`](./.cursor/agents/drinks-fe-frontend.md), [`drinks-fe-verifier.md`](./.cursor/agents/drinks-fe-verifier.md).
- **Guías:** [`.cursor/AGENTS.md`](./.cursor/AGENTS.md) (agentes AI); [`.cursor/AGENT.md`](./.cursor/AGENT.md) (buenas prácticas).
- **Workspace multi-root:** [`drinks.code-workspace`](./drinks.code-workspace) (este repo + `drinks-be` como carpeta hermana).
- **Plantilla de inventario (columnas y reglas):** [`.cursor/docs/INSTRUCCIONES-PLANTILLA-INVENTARIO.md`](./.cursor/docs/INSTRUCCIONES-PLANTILLA-INVENTARIO.md); copia servida en [`public/templates/`](./public/templates/INSTRUCCIONES-PLANTILLA-INVENTARIO.md).
- **Backend (contrato y módulos):** en el repo [drinks-be](../drinks-be), `.cursor/cursorRules/drinks-be-module-docs/SKILL.md` y `drinks-business-rules`.

---

## Mantenimiento de este README

**Actualiza este archivo** cuando cambien comandos, variables de entorno, estructura de carpetas relevante, versión del stack o integración con la API. Así el README sigue siendo la entrada útil para nuevos desarrolladores y para el propio equipo.
