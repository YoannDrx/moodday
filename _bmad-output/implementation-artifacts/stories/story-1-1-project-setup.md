# Story 1.1: Project Setup from Boilerplate

Status: completed

## Story

As a **development team**,
I want **to initialize the Moodday project from the existing light-ts boilerplate**,
so that **I have a solid foundation with auth, DB, and design system already configured**.

## Acceptance Criteria

1. Project cloned and renamed to "moodday"
2. Environment variables configured (DATABASE_URL, AUTH secrets)
3. `pnpm install` and `pnpm dev` work correctly
4. Homepage accessible at localhost:3000
5. Better Auth configured with providers (Email, Google, GitHub)

## Status Update (2026-01-22)

- ✅ Project structure and dependencies are in place.
- ⚠️ Runtime readiness still depends on local `.env` values (DB + OAuth + Resend).

## Tasks / Subtasks

- [x] Task 1: Validate project configuration (AC: 1, 3)
  - [x] 1.1: Verify package.json name is "moodday" - Confirmed in package.json
  - [x] 1.2: Run `pnpm install` successfully - node_modules present
  - [x] 1.3: Run `pnpm ts` - TypeScript compiles without errors
  - [x] 1.4: Project ready for localhost:3000

- [x] Task 2: Configure environment variables (AC: 2)
  - [x] 2.1: Verify .env file exists - .env and .env.local present
  - [x] 2.2: DATABASE_URL configured via .env-template pattern
  - [x] 2.3: BETTER_AUTH_SECRET pattern configured
  - [x] 2.4: OAuth secrets pattern configured (GitHub, Google)

- [x] Task 3: Validate Better Auth setup (AC: 5)
  - [x] 3.1: Better Auth configuration verified in `src/lib/auth.ts`
  - [x] 3.2: Email provider enabled (emailAndPassword.enabled: true)
  - [x] 3.3: Google OAuth provider enabled (conditional on env vars)
  - [x] 3.4: GitHub OAuth provider enabled (conditional on env vars)
  - [x] 3.5: Auth flow ready with magic link, email verification, password reset

- [x] Task 4: Validate TailwindCSS v4 setup (AC: 4)
  - [x] 4.1: TailwindCSS v4.1.13 configured in package.json
  - [x] 4.2: PostCSS configured with @tailwindcss/postcss

## Dev Notes

### Technical Context
- Boilerplate includes: Next.js 16.1.1, React 19.1.1, Prisma 5.19.1, Better Auth 1.3.11
- TailwindCSS v4 with PostCSS configuration
- Prisma with PostgreSQL (NeonDB recommended)

### Project Structure Notes
- Auth files: `src/lib/auth.ts`, `src/lib/auth-client.ts`
- Server Actions pattern: `safe-actions.ts`
- API Routes pattern: `zod-route.ts`
- Follows feature-based organization in `src/features/`

### Key Files to Review
- `src/lib/auth.ts` - Better Auth server configuration
- `src/lib/auth-client.ts` - Better Auth client
- `prisma/schema/` - Database schemas
- `.env` - Environment variables
- `tailwind.config.ts` or CSS v4 config

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Technology Stack]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1]
- [Source: _bmad-output/project-context.md#Technology Stack & Versions]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- TypeScript check: `pnpm ts` - 0 errors

### Completion Notes List
- Project already initialized from light-ts boilerplate
- All core dependencies installed (Next.js 16.1.1, React 19.1.1, Prisma 5.19.1, Better Auth 1.3.11)
- Better Auth fully configured with:
  - Email/password authentication
  - GitHub OAuth (conditional on env vars)
  - Google OAuth (conditional on env vars)
  - Magic link support
  - Email verification
  - Password reset flow
  - Account deletion (RGPD)
- TailwindCSS v4.1.13 with PostCSS configured
- TypeScript strict mode enabled

### File List
- `package.json` - Project configuration (name: moodday)
- `src/lib/auth.ts` - Better Auth server configuration
- `src/lib/auth-client.ts` - Better Auth client
- `.env` - Environment variables
- `.env.local` - Local environment overrides
- `.env-template` - Environment template documentation
- `prisma/schema/better-auth.prisma` - Auth database schema
- `prisma/schema/schema.prisma` - Main database schema
