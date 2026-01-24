---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
workflowComplete: true
completedAt: "2026-01-20"
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
  - "_bmad-output/planning-artifacts/product-brief-moodday-2026-01-20.md"
workflowType: 'architecture'
project_name: 'moodday'
user_name: 'Yoannandrieux'
date: '2026-01-20'
---

# Architecture Decision Document - Moodday

_Ce document se construit collaborativement, section par section. Les décisions architecturales sont ajoutées à mesure qu'on les valide ensemble._

## Implementation Status (2026-01-23)

**Snapshot:** See `PROJECT_STATUS.md` for full audit.

- ✅ Prisma schema for core models + caregiver relationships + mood extensions
- ✅ Recharts used for mood charts
- ✅ PDF export via `@react-pdf/renderer`
- ✅ Image upload via Vercel Blob adapter (config required)
- ✅ Stripe billing portal wired in settings
- ✅ Service Worker + manifest + offline page
- ✅ Offline queue + auto sync for mood entries
- ✅ Offline action queue pour meds/exercises/therapy
- ✅ Push notifications serveur (VAPID + cron route)
- ⚠️ Offline sync avance (IndexedDB/conflits) + rappels par medicament non implemente

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
44 FRs organisés en 9 domaines fonctionnels. Core: Mood Tracking (5), Medications (8), Therapy/Exercises (8), Visualization (4), Export PDF (3), PWA/Offline (4).

**Non-Functional Requirements:**
23 NFRs avec focus sur:
- Performance: Quick check-in <30s, LCP<2.5s, Bundle<200KB
- Sécurité: Chiffrement, RGPD, rate limiting
- Fiabilité: Offline-first, sync automatique, 99.5% uptime
- Accessibilité: WCAG 2.1 AA, touch targets 44px
- Scalabilité: 500→10K utilisateurs sur 12 mois

**Scale & Complexity:**
- Primary domain: Full-stack PWA (Next.js)
- Complexity level: Medium
- Estimated architectural components: ~15 (6 models Prisma, 4 features principales, 5 services transverses)

### Technical Constraints & Dependencies

| Contrainte | Impact |
|------------|--------|
| Boilerplate Next.js 15 + Prisma + Better Auth | Stack imposée, pas de choix |
| PWA offline-first obligatoire | Service Worker + IndexedDB |
| iOS Safari PWA limitations | Pas de push fiable, quota storage |
| Check-in < 30 secondes | UX optimisée, minimal JS |
| RGPD compliance | Export data, delete cascade |

### Cross-Cutting Concerns Identified

| Concern | Solution |
|---------|----------|
| Offline/Sync | Service Worker queue + IndexedDB + conflict resolution |
| Authentication | Better Auth middleware sur routes protégées |
| Timestamps | Prisma `createdAt/updatedAt` automatiques |
| Soft delete | `archivedAt` pour Medications, Exercises |
| RGPD | Cascade delete user, JSON export endpoint |
| Dosage history | Table séparée MedicationHistory |

## Starter Template Evaluation

### Primary Technology Domain

Full-stack PWA (Next.js) - basé sur boilerplate existant.

### Starter Selection

**Approche:** Utilisation du boilerplate existant (déjà configuré)

**Rationale:**
- Stack moderne et éprouvée (Next.js 15 + React 19)
- Auth, DB, Styling déjà configurés
- Réduction du temps de setup
- Conventions établies

**Pas d'initialisation nécessaire** - le projet existe déjà.

### Architectural Decisions Provided by Boilerplate

**Language & Runtime:**
- TypeScript 5+ en mode strict
- Node.js 20+ (via Vercel)
- React 19 avec Server Components

**Styling Solution:**
- TailwindCSS v4 avec configuration custom
- Shadcn/UI comme base de composants
- CSS Variables pour theming

**Build Tooling:**
- Turbopack (dev) via Next.js
- SWC (build)
- Code splitting automatique

**Testing Framework:**
- Vitest pour tests unitaires
- Playwright pour E2E
- React Testing Library

**Code Organization:**
- `app/` - Pages et layouts (App Router)
- `src/components/` - Composants UI
- `src/features/` - Logique par feature
- `src/lib/` - Utilitaires et services
- `prisma/` - Schema et migrations

**Development Experience:**
- Hot reload via Turbopack
- TypeScript strict
- ESLint + Prettier
- pnpm pour package management

### Decisions Still Needed for Moodday

| Category | Decision Required |
|----------|-------------------|
| PWA | Service Worker library choice |
| Offline | IndexedDB wrapper choice |
| Charts | Visualization library |
| PDF | Generation approach |
| Data Models | Prisma schema design |

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- PWA Service Worker strategy → Serwist
- Offline storage → Dexie.js
- Data visualization → Recharts
- PDF generation → @react-pdf/renderer

**Provided by Boilerplate (Already Decided):**
- Database: PostgreSQL + Prisma
- Auth: Better Auth
- Frontend: React 19 + TailwindCSS + Shadcn/UI
- Hosting: Vercel
- API: Server Actions + API Routes

**Deferred Decisions (Post-MVP):**
- Real-time sync (WebSockets) → V1 avec aidants
- Push notifications strategy → Dépend iOS support
- AI/ML pipeline → V2

### Data Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Database** | PostgreSQL (NeonDB) | Boilerplate, serverless-ready |
| **ORM** | Prisma | Type-safe, migrations, boilerplate |
| **Offline Storage** | Dexie.js | IndexedDB wrapper avec queries, sync support |
| **Caching** | None (MVP) | Vercel edge + Prisma sufficient |

**Sync Strategy:**
- Dexie.js stocke les entrées offline
- Sync au retour connexion via queue
- Conflict resolution: last-write-wins (timestamp)

### Authentication & Security

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Auth Provider** | Better Auth | Boilerplate, multi-provider |
| **Session** | JWT + Database sessions | Better Auth default |
| **Authorization** | Middleware Next.js | Route protection |
| **Data Encryption** | At rest via NeonDB | Managed encryption |
| **RGPD** | Cascade delete + JSON export | Compliance |

### API & Communication Patterns

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Primary API** | Server Actions | Boilerplate, type-safe |
| **Webhooks** | API Routes | Stripe, external services |
| **Validation** | Zod | Boilerplate, schema validation |
| **Error Handling** | safe-actions pattern | Boilerplate convention |

### Frontend Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **State Management** | React Server Components + URL state (nuqs) | Boilerplate |
| **Charts** | Recharts | React natif, simple API, line + area charts |
| **PDF** | @react-pdf/renderer | React components, client-side, offline capable |
| **Forms** | React Hook Form + Zod | Boilerplate |
| **PWA** | Serwist | Modern, Next.js 15 App Router support |

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Hosting** | Vercel | Boilerplate, edge functions |
| **Database** | NeonDB | Serverless PostgreSQL |
| **CI/CD** | Vercel Git Integration | Auto-deploy |
| **Monitoring** | Vercel Analytics (MVP) | Built-in |

### Decision Impact Analysis

**Implementation Sequence:**
1. Prisma schema (data models)
2. Serwist PWA setup
3. Dexie.js offline store
4. Core features (mood, meds, therapy)
5. Recharts visualizations
6. PDF export

**Cross-Component Dependencies:**
- Dexie.js ↔ Serwist (offline sync)
- Prisma models ↔ Dexie schema (mirror structure)
- Recharts ↔ Mood data queries
- PDF ↔ All data models (export)

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database (Prisma):**
- Tables: PascalCase singulier (`User`, `MoodEntry`, `Medication`)
- Colonnes: camelCase (`userId`, `createdAt`, `dosageAmount`)
- Enums: SCREAMING_SNAKE (`MedicationType.REGULAR`)

**Server Actions:**
- Fichiers: `{domain}.action.ts`
- Functions: camelCase verbe+nom (`createMoodEntry`)
- Schemas: `{action}Schema` (`createMoodEntrySchema`)

**Components:**
- Noms: PascalCase (`MoodSlider`)
- Fichiers: kebab-case (`mood-slider.tsx`)
- Hooks: `use{Feature}` (`useMoodEntries`)

### Structure Patterns

**Feature Organization:**
```
src/features/{feature}/
├── {feature}.action.ts
├── {feature}.schema.ts
├── components/
└── hooks/
```

**Test Organization:**
- Unit: `__tests__/{feature}/`
- E2E: `e2e/`

### Format Patterns

**API Responses (safe-actions):**
```typescript
{ data: T, error: null } // Success
{ data: null, error: string } // Error
```

**Dates:**
- API/DB: ISO 8601 strings
- Display: `dd/MM/yyyy` (FR locale)

**JSON:** camelCase, explicit nulls

### Offline Patterns

**Dexie Sync Status:**
- `pending`: créé offline, pas sync
- `synced`: sync avec serverId
- `conflict`: résolution nécessaire

**Sync Strategy:** Last-write-wins avec timestamp

### Error Handling Patterns

**User Errors:** Toast messages bienveillants
**Technical Errors:** Console.error + monitoring
**Recovery:** Auto-retry pour sync offline

### Enforcement Rules

**All Agents MUST:**
1. Utiliser safe-actions pour toutes les mutations
2. Valider avec Zod avant DB write
3. Gérer offline state pour MoodEntry, MedIntake
4. Suivre les conventions de nommage du boilerplate
5. Ne jamais hardcoder de textes (i18n ready)

## Project Structure & Boundaries

### Complete Project Directory Structure

```
moodday/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Routes auth
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── verify-email/page.tsx
│   ├── (dashboard)/                  # Routes protégées
│   │   ├── layout.tsx                # Dashboard layout + BottomNav
│   │   ├── page.tsx                  # Dashboard home
│   │   ├── mood/page.tsx
│   │   ├── medications/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── therapy/
│   │   │   ├── page.tsx
│   │   │   └── session/[id]/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── export/page.tsx
│   │   └── settings/page.tsx
│   ├── (marketing)/page.tsx          # Landing
│   ├── api/
│   │   ├── webhooks/stripe/route.ts
│   │   └── export/pdf/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── manifest.ts                   # PWA manifest
├── src/
│   ├── components/
│   │   ├── ui/                       # Shadcn/UI customisé
│   │   └── nowts/                    # Composants Moodday
│   │       ├── mood-slider.tsx
│   │       ├── med-checkbox.tsx
│   │       ├── glass-card.tsx
│   │       ├── mood-chart.tsx
│   │       ├── bottom-nav.tsx
│   │       ├── sync-indicator.tsx
│   │       └── quick-entry-modal.tsx
│   ├── features/
│   │   ├── mood/                     # FR7-11
│   │   │   ├── mood.action.ts
│   │   │   ├── mood.schema.ts
│   │   │   └── hooks/use-mood-entries.ts
│   │   ├── medication/               # FR12-19
│   │   │   ├── medication.action.ts
│   │   │   ├── medication.schema.ts
│   │   │   └── hooks/use-medications.ts
│   │   ├── therapy/                  # FR20-27
│   │   │   ├── therapy.action.ts
│   │   │   └── therapy.schema.ts
│   │   ├── analytics/                # FR28-31
│   │   │   └── analytics.action.ts
│   │   ├── export/                   # FR32-34
│   │   │   └── export.action.ts
│   │   └── onboarding/               # FR42-44
│   │       └── onboarding.action.ts
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── offline/
│   │   │   ├── dexie-db.ts
│   │   │   ├── sync-queue.ts
│   │   │   └── use-offline-sync.ts
│   │   ├── pwa/service-worker.ts
│   │   ├── pdf/report-template.tsx
│   │   └── actions/safe-actions.ts
│   ├── hooks/
│   └── types/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/icons/                     # PWA icons
├── __tests__/features/
├── e2e/
├── emails/
└── package.json
```

### Feature → Directory Mapping

| Feature | Directory | Server Actions |
|---------|-----------|----------------|
| Auth (FR1-6) | `app/(auth)/`, `src/lib/auth.ts` | Boilerplate |
| Mood (FR7-11) | `src/features/mood/` | `createMoodEntry`, `getMoodEntries` |
| Medications (FR12-19) | `src/features/medication/` | `createMedication`, `logIntake` |
| Therapy (FR20-27) | `src/features/therapy/` | `createSession`, `logExercise` |
| Analytics (FR28-31) | `src/features/analytics/` | `getTrendData` |
| Export (FR32-34) | `src/features/export/` | `generatePDF` |
| PWA/Offline (FR38-41) | `src/lib/offline/`, `src/lib/pwa/` | Serwist + Dexie |
| Onboarding (FR42-44) | `src/features/onboarding/` | `completeOnboarding` |

### Architectural Boundaries

**API Boundaries:**
- Server Actions: Primary (toutes mutations CRUD)
- API Routes: Secondary (webhooks, PDF server-side)
- Middleware: Auth protection sur `(dashboard)`

**Data Boundaries:**
- Prisma → PostgreSQL (source of truth)
- Dexie → IndexedDB (cache offline)
- Sync Queue → Pending offline actions

**Component Boundaries:**
- Server → Client: Server Components + props
- Client → Server: Server Actions
- Offline → Online: Sync queue events

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** Toutes les technologies sont compatibles (Next.js 15 + Serwist + Dexie + Recharts + @react-pdf/renderer).

**Pattern Consistency:** Les patterns de nommage, structure et communication sont alignés avec le boilerplate existant.

**Structure Alignment:** La structure projet supporte toutes les décisions architecturales.

### Requirements Coverage ✅

**Functional Requirements:** 44/44 FRs couverts (100%)

| Catégorie | FRs | Couverture |
|-----------|-----|------------|
| Auth (FR1-6) | 6 | ✅ Better Auth |
| Mood (FR7-11) | 5 | ✅ features/mood/ + Dexie |
| Meds (FR12-19) | 8 | ✅ features/medication/ |
| Therapy (FR20-27) | 8 | ✅ features/therapy/ |
| Analytics (FR28-31) | 4 | ✅ features/analytics/ + Recharts |
| Export (FR32-34) | 3 | ✅ features/export/ + @react-pdf |
| Settings (FR35-37) | 3 | ✅ Boilerplate |
| PWA/Offline (FR38-41) | 4 | ✅ Serwist + Dexie |
| Onboarding (FR42-44) | 3 | ✅ features/onboarding/ |

**Non-Functional Requirements:** 23/23 NFRs couverts (100%)

### Implementation Readiness ✅

**Decision Completeness:** Toutes les décisions critiques documentées avec rationale
**Structure Completeness:** Arbre projet complet avec mapping features
**Pattern Completeness:** Patterns naming/structure/format/offline définis

### Gap Analysis

| Gap | Priorité | Resolution |
|-----|----------|------------|
| Schema Prisma | 🔴 Critique | Défini dans Epics & Stories |
| Dexie schema | 🟠 Important | Mirror de Prisma |
| PWA manifest | 🟢 Nice-to-have | Implementation |
| i18n | 🟢 Nice-to-have | Post-MVP |

### Architecture Readiness Assessment

**Overall Status:** ✅ READY FOR IMPLEMENTATION

**Confidence Level:** HIGH

**Key Strengths:**
- Stack moderne et cohérente
- Offline-first bien pensé (Serwist + Dexie)
- Patterns clairs pour agents IA
- 100% couverture requirements

**Areas for Future Enhancement:**
- Schema Prisma détaillé (Epics)
- Tests E2E offline scenarios
- Monitoring/alerting avancé

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2026-01-20
**Document Location:** `_bmad-output/planning-artifacts/architecture.md`

### Final Architecture Deliverables

**📋 Complete Architecture Document**
- Toutes les décisions architecturales documentées avec versions
- Patterns d'implémentation assurant la consistance
- Structure projet complète avec tous les fichiers
- Mapping requirements → architecture
- Validation confirmant cohérence et complétude

**🏗️ Implementation Ready Foundation**
- 15+ décisions architecturales
- 5 catégories de patterns définis
- 8 features mappées
- 44 FRs + 23 NFRs couverts (100%)

### Implementation Handoff

**For AI Agents:**
Ce document d'architecture est votre guide complet pour implémenter Moodday. Suivez toutes les décisions, patterns et structures exactement comme documenté.

**Development Sequence:**
1. Créer le schema Prisma (Epics & Stories)
2. Setup Serwist PWA
3. Setup Dexie offline store
4. Implémenter features par feature
5. Maintenir la consistance avec les règles documentées

### Quality Assurance Checklist

**✅ Architecture Coherence**
- [x] Toutes les décisions fonctionnent ensemble
- [x] Technologies compatibles
- [x] Patterns supportent les décisions
- [x] Structure alignée avec les choix

**✅ Requirements Coverage**
- [x] 44/44 FRs supportés
- [x] 23/23 NFRs adressés
- [x] Cross-cutting concerns gérés
- [x] Points d'intégration définis

**✅ Implementation Readiness**
- [x] Décisions spécifiques et actionnables
- [x] Patterns préviennent les conflits
- [x] Structure complète et non-ambiguë

---

**Architecture Status:** ✅ READY FOR IMPLEMENTATION

**Next Phase:** Epics & Stories avec schema Prisma détaillé
