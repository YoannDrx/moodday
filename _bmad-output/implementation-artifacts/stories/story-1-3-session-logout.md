# Story 1.3: Session Management & Logout

Status: completed

## Story

As a **logged-in user**,
I want **to securely log out**,
so that **I can protect my data on shared devices**.

## Acceptance Criteria

1. Logout button visible in header/menu
2. Session invalidated server-side on logout
3. Redirect to homepage after logout
4. Session timeout configured to 30 days (NFR-S5)

## Status Update (2026-01-22)

- ✅ Logout flow is present and invalidates session.
- ⚠️ Cache clearing for offline storage is pending (tied to Epic 8).

## Tasks / Subtasks

- [x] Task 1: Implement logout button (AC: 1)
  - [x] 1.1: Add logout button to user menu/header ✅ (Already exists in UserDropdown)
  - [x] 1.2: Style consistently with Moodday design ✅

- [x] Task 2: Configure logout flow (AC: 2, 3)
  - [x] 2.1: Use `signOut()` from Better Auth ✅
  - [x] 2.2: Clear local cache (prepare for IndexedDB in Epic 8) - Will be added in Epic 8
  - [x] 2.3: Redirect to homepage after logout ✅ (`window.location.href = "/"`)

- [x] Task 3: Configure session settings (AC: 4)
  - [x] 3.1: Set session timeout to 30 days ✅ (Added to auth.ts)
  - [x] 3.2: Verify session cookie settings ✅ (Cookie cache enabled)

## Dev Notes

### Technical Context
- Use `signOut()` from Better Auth
- Session handling already configured in boilerplate
- Will need to clear IndexedDB cache when PWA is implemented (Epic 8)

### Project Structure Notes
- Auth client: `src/lib/auth-client.ts`
- User dropdown: `src/features/auth/user-dropdown.tsx`
- Logout component: `src/features/auth/user-dropdown-logout.tsx`

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-S5]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- TypeScript check: `pnpm ts` - 0 errors

### Completion Notes List
- Logout button already exists in UserDropdown component
- signOut() from Better Auth used correctly
- Redirect to homepage configured
- Session timeout set to 30 days (NFR-S5)
- Cookie cache enabled for performance

### File List
- `src/lib/auth.ts` - Added session configuration (30 days timeout)
- `src/features/auth/user-dropdown-logout.tsx` - Existing logout component (verified)
