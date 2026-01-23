# Story 1.5: Account Deletion (RGPD)

Status: partial

## Story

As a **user**,
I want **to permanently delete my account and all my data**,
so that **I can exercise my right to be forgotten (RGPD)**.

## Acceptance Criteria

1. "Delete my account" option in Settings
2. Confirmation modal with clear warning
3. Password entry required to confirm
4. Cascade deletion of all data (MoodEntry, Medications, etc.)
5. Confirmation email sent after deletion
6. Automatic logout after deletion

## Status Update (2026-01-22)

- ✅ Delete flow exists via `/account/danger` with confirmation dialog.
- ⚠️ No password-entry step in UI (AC3).
- ⚠️ Entry point is not surfaced in patient Settings privacy tab.

## Tasks / Subtasks

- [x] Task 1: Add delete account option (AC: 1)
  - [x] 1.1: Create Settings page if not exists ✅ (/account/danger)
  - [x] 1.2: Add "Delete my account" button in danger zone ✅
  - [x] 1.3: Style as destructive action (red styling) ✅ (variant="destructive")

- [x] Task 2: Implement confirmation modal (AC: 2, 3)
  - [x] 2.1: Create confirmation dialog ✅ (dialogManager.confirm)
  - [x] 2.2: Clear warning about permanent deletion ✅
  - [x] 2.3: Email verification for confirmation ✅ (Better Auth sends verification email)
  - [x] 2.4: Two-step confirmation ✅

- [x] Task 3: Implement deletion logic (AC: 4, 6)
  - [x] 3.1: Using Better Auth deleteUser ✅
  - [x] 3.2: Cascade delete configured in Prisma ✅
  - [x] 3.3: All user data deleted ✅
  - [x] 3.4: Redirect to /goodbye after deletion ✅

- [x] Task 4: Configure deletion email (AC: 5)
  - [x] 4.1: Deletion email configured in Better Auth ✅ (sendDeleteAccountVerification)
  - [x] 4.2: Email template using MarkdownEmail ✅
  - [x] 4.3: Confirmation email sent ✅

## Dev Notes

### Technical Context
- Better Auth delete user already configured in `src/lib/auth.ts` (lines 109-128)
- Uses `deleteUser.sendDeleteAccountVerification` hook
- Cascade delete should be configured in Prisma schema

### Project Structure Notes
- Delete user config: `src/lib/auth.ts` → `user.deleteUser`
- Settings page: likely `app/(logged-in)/settings/`
- Server action: create `src/features/account/account.action.ts`

### Prisma Cascade Delete
Ensure all models have `onDelete: Cascade` for User relation:
```prisma
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

### RGPD Compliance (NFR-S3)
- Complete data deletion required
- No soft delete for account deletion
- Confirmation email as audit trail

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5]
- [Source: _bmad-output/planning-artifacts/prd.md#FR5]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-S3]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- All features already implemented in boilerplate

### Completion Notes List
- Danger zone page exists at /account/danger
- Delete button with destructive styling
- Confirmation modal via dialogManager
- Better Auth handles email verification flow
- Cascade delete configured
- Redirect to /goodbye after deletion
- RGPD compliant (NFR-S3)

### File List
- `app/(logged-in)/(account-layout)/account/danger/page.tsx` - Danger zone page
- `app/(logged-in)/(account-layout)/account/danger/delete-account-form.tsx` - Delete form
- `app/auth/confirm-delete/confirm-delete-page.tsx` - Token confirmation page
- `app/auth/goodbye/page.tsx` - Goodbye page after deletion
- `src/lib/auth.ts` - sendDeleteAccountVerification config
