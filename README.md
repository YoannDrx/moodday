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

- Authentication (GitHub, Google, Magic Links)
- Stripe Subscriptions (Free, Pro, Ultra)
- PostgreSQL with Prisma
- Transactional Emails (Resend)
- Admin Dashboard
- i18n (EN/FR)
- Tests (Vitest + Playwright)

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
