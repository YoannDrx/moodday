# Story 3.4: Edit & Archive Medication

Status: completed

## Story

As a **user**,
I want **to edit or archive a medication**,
so that **I can adjust my treatment without losing history**.

## Acceptance Criteria

1. Edit page with pre-filled form
2. Archive button (soft delete)
3. Archiving preserves intake history
4. Archived medication hidden from active list
5. Ability to view archived medications

## Status Update (2026-01-22)

- ✅ Edit + archive + restore flows work with real data.

## Tasks / Subtasks

- [x] Task 1: Create medication detail page
  - [x] 1.1: Create page at /medications/[id] ✅
  - [x] 1.2: Display medication info (name, dosage, frequency) ✅
  - [x] 1.3: PRN badge and archived badge ✅
  - [x] 1.4: Dosage history timeline ✅

- [x] Task 2: Create edit medication page (AC: 1)
  - [x] 2.1: Create page at /medications/[id]/edit ✅
  - [x] 2.2: Pre-filled form using useQuery ✅
  - [x] 2.3: Reuse form fields from add form ✅

- [x] Task 3: Archive functionality (AC: 2, 3, 4)
  - [x] 3.1: Archive button with AlertDialog ✅
  - [x] 3.2: archiveMedication server action (already exists) ✅
  - [x] 3.3: Redirect to list after archive ✅

- [x] Task 4: Restore functionality (AC: 5)
  - [x] 4.1: Restore button on archived medication detail ✅
  - [x] 4.2: unarchiveMedication server action (already exists) ✅

- [x] Task 5: Add i18n translations
  - [x] 5.1: medication.detail.* keys in en.ts ✅
  - [x] 5.2: medication.detail.* keys in fr.ts ✅

## Dev Notes

### Technical Context
- Server actions already exist from Story 3.2
- Form uses useZodForm with values prop for pre-fill
- AlertDialog for archive confirmation

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- Fixed ESLint floating promises with void operator
- Fixed unnecessary condition on medication.history
- Removed unused index variable

### Completion Notes List
- Detail page with medication info
- Dosage history timeline
- Edit page with pre-filled form
- Archive with AlertDialog confirmation
- Restore button for archived meds
- i18n translations (FR + EN)
- TypeScript check passed

### File List
- `app/(logged-in)/medications/[id]/page.tsx` - Detail page
- `app/(logged-in)/medications/[id]/_components/medication-detail.tsx` - Detail component
- `app/(logged-in)/medications/[id]/edit/page.tsx` - Edit page
- `app/(logged-in)/medications/[id]/edit/_components/edit-medication-form.tsx` - Edit form
- `src/i18n/messages/en.ts` - English translations
- `src/i18n/messages/fr.ts` - French translations
