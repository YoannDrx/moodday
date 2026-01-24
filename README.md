# Moodday

Moodday est une application web PWA de suivi psychiatrique destinée aux personnes vivant avec des troubles mentaux (TDAH, bipolarité, dépression, anxiété) .

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
- PDF export + RGPD JSON export
- User settings (notifications, display, theme light/dark/zen, timezone, avatar)
- Onboarding wizard (mood + meds + preferences + caregiver invite)
- PWA (manifest + offline page + offline queues + sync + push notifications serveur)
- Authentication (Email, GitHub, Google)
- PostgreSQL with Prisma
- i18n (EN/FR)
- Tests (Vitest + Playwright)

> Note: les rappels par medicament et la planification cron restent a finaliser.

## Project Status (2026-01-23)

See `PROJECT_STATUS.md` for a detailed, page-by-page audit of what is fully functional, what is mock/UI-only, and what remains to implement for the MVP and beyond.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm setup` | Configure cloud services |
| `pnpm doctor` | Check project health |
| `pnpm build` | Build for production |
| `pnpm test:ci` | Run unit tests |
| `pnpm test:e2e:ci` | Run E2E tests |

## Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS v4 with Shadcn/UI
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Better Auth
- **Payments**: Stripe
- **Emails**: React Email + Resend

## Documentation

See [CLAUDE.md](./CLAUDE.md) for detailed project documentation.

## License

MIT
