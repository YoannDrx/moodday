# Moodday

Moodday est un journal personnel PWA de santé mentale, confidentiel et non médical. Il aide à conserver ses propres repères d'humeur, de traitements et de bien-être sans établir de diagnostic ni formuler de recommandation thérapeutique.

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
pnpm setup
```

### 3. Start developing

```bash
pnpm dev
```

## Features

- Mood tracking (quick entry + journal détaillé + historique)
- Sleep & energy tracking (via journal)
- Anxiety score tracking
- Medication management (CRUD, intakes, PRN, dosage history)
- Therapy notes + exercises tracking
- Caregiver circle (invites email, observations, events)
- Insights (mood chart + patterns + dosage markers + correlations + IA optionnelle)
- PDF personnel + exports CSV et JSON RGPD
- User settings (notifications, display, theme light/dark/zen, timezone, avatar)
- Onboarding wizard (mood + meds + preferences + caregiver invite)
- PWA (manifest + offline page + offline queues + sync + push notifications serveur)
- Authentication (Email, GitHub, Google)
- PostgreSQL with Prisma
- Rate limiting atomique dans PostgreSQL, sans Redis ni Upstash
- i18n (EN/FR)
- Tests (Vitest + Playwright)

> Note : les journaux idempotents de notifications et d'accès aidant sont promus sur la branche Neon principale. La validation VAPID sur deux navigateurs nécessite encore une preview dont la base et les services tiers sont isolés de Production.

## Project Status (2026-01-23)

See `PROJECT_STATUS.md` for a detailed, page-by-page audit of what is fully functional, what is mock/UI-only, and what remains to implement for the MVP and beyond.

## Commands

| Command            | Description              |
| ------------------ | ------------------------ |
| `pnpm dev`         | Start development server |
| `pnpm setup`       | Configure cloud services |
| `pnpm doctor`      | Check project health     |
| `pnpm build`       | Build for production     |
| `pnpm test:ci`     | Run unit tests           |
| `pnpm test:e2e:ci` | Run E2E tests            |

## Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS v4 with Shadcn/UI
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Better Auth
- **Payments**: Stripe
- **Emails**: React Email + Resend

## Documentation

- `docs/audits/production-readiness-2026-08.md` : source de vérité des preuves et gates de production.
- `docs/design-system.md` : identité et règles UI/UX.
- `docs/data-lifecycle.md` : contenu des exports, fichiers et règles de purge.
- `docs/migrations/` : historique et procédures de migration.
- `PROJECT_STATUS.md` : audit fonctionnel détaillé.

## License

MIT
