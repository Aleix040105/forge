# Forge — Build in public. Ship with proof.

Red social de ejecución para fundadores. Stack: Next.js 14 + Supabase + Tailwind.

## Setup en 5 pasos

### 1. Instalar dependencias
```bash
cd forge
npm install
```

### 2. Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo.
2. Copia la URL y la Anon Key desde `Settings > API`.

### 3. Configurar variables de entorno
Edita `.env.local` con tus credenciales reales:
```
NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 4. Ejecutar el esquema de base de datos
En el SQL Editor de Supabase, pega y ejecuta el contenido de:
```
supabase/migrations/001_initial_schema.sql
```

### 5. Crear bucket de Storage
En Supabase > Storage, crea un bucket llamado `uploads` con acceso público.

### 6. Arrancar el servidor
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura

```
forge/
├── app/              — Páginas (App Router)
├── components/       — Componentes React
├── lib/              — Supabase client + queries
├── types/            — TypeScript types
└── supabase/         — SQL migrations
```

## Features implementadas (Fase 1)

- ✅ Auth (registro, login, onboarding 5 pasos)
- ✅ Perfiles con sección "Now" (objective, needs, offers)
- ✅ Post types: Update + Ship Log (con proof requerida)
- ✅ Feed: "Para ti" (algorítmico) + "Siguiendo" (cronológico)
- ✅ Reacciones: Accionable + Offer Help (con límite de 140 chars)
- ✅ Sistema de follow (personas y proyectos)
- ✅ Proyectos con timeline de posts vinculados
- ✅ Post individual con replies (hasta 3 niveles)
- ✅ Explore: Trending + personas sugeridas
- ✅ Forge tab: Mis Ships + stats
- ✅ Cells: placeholder (Fase 2)
- ✅ Notificaciones en tiempo real (Supabase Realtime)
- ✅ Dark mode por defecto

## Próximos pasos (Fase 2)

- Ask post type completo
- Bounties con escrow (Stripe)
- Cells con ciclos de 14 días + Demo Day
- Reputation Score calculado automáticamente
- Re-forge con comentario
- Analytics de perfil
