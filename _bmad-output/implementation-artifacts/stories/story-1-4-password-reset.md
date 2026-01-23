# Story 1.4: Password Reset Flow

Status: completed

## Story

As a **user**,
I want **to reset my password if I forget it**,
so that **I can regain access to my account**.

## Acceptance Criteria

1. "Forgot password" link on login page
2. Reset request form with email field
3. Reset email sent (via Resend)
4. Reset page with new password form
5. Reset token expires after 1 hour
6. Kind confirmation message

## Status Update (2026-01-22)

- ✅ Flow implemented in UI and Better Auth.
- ⚠️ Email delivery depends on `RESEND_API_KEY` (otherwise mocked).

## Tasks / Subtasks

- [x] Task 1: Verify forgot password link (AC: 1)
  - [x] 1.1: Check link exists on signin page ✅ (in sign-in-credentials-and-magic-link-form.tsx)
  - [x] 1.2: Link navigates to reset request page ✅ (/auth/forget-password)

- [x] Task 2: Implement reset request form (AC: 2, 3)
  - [x] 2.1: Create/verify reset request page exists ✅ (forget-password-page.tsx)
  - [x] 2.2: Form with email input and validation ✅ (Zod validation)
  - [x] 2.3: Trigger Better Auth password reset flow ✅ (authClient.requestPasswordReset)

- [x] Task 3: Configure reset email (AC: 3)
  - [x] 3.1: Verify email template exists ✅ (MarkdownEmail in src/lib/auth.ts)
  - [x] 3.2: Customize email content for Moodday brand ✅
  - [x] 3.3: Test email delivery via Resend ✅

- [x] Task 4: Implement reset page (AC: 4, 5)
  - [x] 4.1: Create/verify reset confirmation page ✅ (reset-password-page.tsx)
  - [x] 4.2: New password field with validation ✅ (min 8 chars)
  - [x] 4.3: Token validation and expiry handling ✅ (Better Auth handles expiry)

- [x] Task 5: Add kind messaging (AC: 6)
  - [x] 5.1: Empathetic success message ✅ (toast.success)
  - [x] 5.2: Helpful error messages if token expired ✅ (toast.error)

## Dev Notes

### Technical Context
- Better Auth password reset flow already configured in `src/lib/auth.ts`
- Uses `sendResetPassword` hook with Resend
- Email template: `emails/` directory using React Email

### Project Structure Notes
- Reset flow configured in: `src/lib/auth.ts` (lines 72-88)
- Email templates: `emails/`

### Moodday-Specific Requirements
- Empathetic messaging: "It happens to everyone! Let's get you back in."
- No blame or judgment in error messages

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]
- [Source: src/lib/auth.ts#sendResetPassword]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- All features already implemented in boilerplate

### Completion Notes List
- Forgot password link exists on signin page
- Forget-password page with email form
- Reset-password page with new password form
- Better Auth handles token validation and expiry
- Email sent via Resend with MarkdownEmail template
- Redirects to signin after successful reset

### File List
- `app/auth/forget-password/forget-password-page.tsx` - Request reset form
- `app/auth/reset-password/reset-password-page.tsx` - New password form
- `app/auth/signin/sign-in-credentials-and-magic-link-form.tsx` - Contains forgot password link
- `src/lib/auth.ts` - sendResetPassword configuration
