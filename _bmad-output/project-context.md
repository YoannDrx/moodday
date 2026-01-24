---
project_name: 'moodday'
user_name: 'Yoannandrieux'
date: '2026-01-20'
sections_completed: ['all']
---

# Project Context for AI Agents - Moodday

_Règles critiques que les agents IA DOIVENT suivre. Focus sur les détails non-évidents._

---

## Technology Stack & Versions

| Tech | Version | Notes |
|------|---------|-------|
| Next.js | 16.1.1 | App Router, Turbopack dev |
| React | 19.1.1 | Server Components par défaut |
| TypeScript | 5.9.2 | Strict mode |
| TailwindCSS | 4.1.13 | v4 syntax |
| Prisma | 5.19.1 | PostgreSQL |
| Better Auth | 1.3.11 | Multi-provider |
| Zod | 4.1.8 | Validation |
| Vitest | 3.2.4 | Unit tests |
| Playwright | 1.55.0 | E2E tests |

**Moodday-specific:**
- Service Worker custom (public/sw.js)
- Offline queue (localStorage) + auto sync
- Local notifications (check-in + meds)
- Push notifications serveur (VAPID + cron)
- Recharts (visualizations)
- @react-pdf/renderer (PDF export)

---

## Critical Implementation Rules

### TypeScript Rules

- ✅ Utiliser `type` au lieu de `interface` (ESLint enforced)
- ✅ Préférer `??` à `||` pour nullish coalescing
- ✅ Pas d'enums → utiliser des maps/objects
- ✅ Paths: `@/*` (src), `@email/*` (emails), `@app/*` (app)
- ❌ JAMAIS `any` - utiliser `unknown` si nécessaire

### React/Next.js Rules

- ✅ React Server Components par défaut
- ✅ `"use client"` uniquement pour Web APIs (minimal)
- ✅ Wrapper client components dans `Suspense`
- ✅ Dynamic imports pour composants non-critiques
- ❌ JAMAIS fetch() directement → utiliser `up-fetch.ts`

### Server Actions Rules

- ✅ Fichiers: `{domain}.action.ts`
- ✅ TOUJOURS utiliser `safe-actions.ts`
- ✅ Valider avec Zod AVANT DB write
- ✅ Utiliser `resolveActionResult()` côté client
- ❌ JAMAIS créer d'action sans safe-actions wrapper

### API Routes Rules

- ✅ TOUJOURS utiliser `zod-route.ts`
- ✅ Lire `zod-route.ts` avant créer une route
- ❌ JAMAIS fetch() natif → utiliser `up-fetch.ts`

### Auth Rules

- Server: `getUser()` (optionnel), `getRequiredUser()` (requis)
- Client: `useSession()` depuis `auth-client.ts`

---

## File Organization

### Naming Conventions

| Type | Convention | Exemple |
|------|------------|---------|
| Components | PascalCase | `MoodSlider` |
| Files | kebab-case | `mood-slider.tsx` |
| Actions | `{domain}.action.ts` | `mood.action.ts` |
| Schemas | `{domain}.schema.ts` | `mood.schema.ts` |
| Hooks | `use-{name}.ts` | `use-mood-entries.ts` |

### Structure

```
src/features/{feature}/
├── {feature}.action.ts    # Server Actions
├── {feature}.schema.ts    # Zod schemas
├── components/            # Feature components
└── hooks/                 # Feature hooks
```

---

## Testing Rules

### Unit Tests (Vitest)

- Location: `__tests__/{feature}/`
- Pattern: `{name}.test.ts`
- Mock: `vitest-mock-extended`

### E2E Tests (Playwright)

- Location: `e2e/`
- Pattern: `{feature}.spec.ts`
- Utils: `e2e/utils/`

---

## Moodday-Specific Patterns

### Offline/PWA

- Offline queue via localStorage (mood + actions)
- `syncStatus`: `'pending'` | `'synced'` | `'conflict'` (model-level)
- Sync auto au retour online (PwaManager)
- IndexedDB/Dexie planifies pour sync avance

### Components Custom

- Location: `src/components/nowts/`
- Glass-morphism style (backdrop-blur)
- Touch targets: 44px minimum

### Microcopy

- Ton bienveillant, JAMAIS culpabilisant
- Pas de "streak guilt"
- Messages d'erreur empathiques

---

## Anti-Patterns (INTERDIT)

| ❌ Ne JAMAIS faire | ✅ Faire à la place |
|-------------------|---------------------|
| `fetch()` directement | `up-fetch.ts` |
| Server Action sans safe-actions | `safe-actions.ts` |
| API Route sans zod-route | `zod-route.ts` |
| `interface` pour types | `type` |
| `||` pour nullish | `??` |
| Enums TypeScript | Maps/Objects |
| Modifier sans lire 3 fichiers | Lire contexte d'abord |
| `"use client"` partout | RSC par défaut |

---

## Pre-Modification Checklist

**AVANT de modifier des fichiers, TOUJOURS:**

1. ✅ Lire au moins 3 fichiers similaires
2. ✅ Comprendre les patterns existants
3. ✅ Vérifier les imports/dépendances utilisées
4. ✅ Respecter les conventions de nommage

---

## Implementation Status (2026-01-23)

See `PROJECT_STATUS.md` for the full audit. Summary:
- Core CRUD features exist for mood/meds/therapy/exercises.
- Quick Entry modal/FAB + JournalWizard sont cables a la DB.
- PWA/offline: Service Worker + offline queues + sync + push serveur (VAPID).
