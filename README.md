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

## Skills y reglas (Cursor / AI Agent)

Ver `.cursor/rules/` y `.cursor/skills/` para convenciones y patrones del proyecto.
Ver `AGENT.md` para guía de buenas prácticas y `AGENTS.md` para guía de agentes AI.
