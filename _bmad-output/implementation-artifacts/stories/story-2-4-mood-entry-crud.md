# Story 2.4: Mood Entry CRUD Operations

Status: partial

## Story

As a **user**,
I want **to edit or delete an existing mood entry**,
so that **I can correct an entry mistake**.

## Acceptance Criteria

1. Tap on an entry opens edit modal
2. Value and note pre-filled
3. "Delete" button with confirmation
4. Kind confirmation message (no guilt)
5. Immediate display update

## Status Update (2026-01-22)

- ✅ Server actions implemented (create/update/delete/get).
- ❌ Edit/delete UI relies on Quick Entry modal, which is not mounted.

## Tasks / Subtasks

- [x] Task 1: Add update server action (AC: 1, 2)
  - [x] 1.1: Create updateMoodEntry action ✅
  - [x] 1.2: Add ownership verification ✅
  - [x] 1.3: Zod schema validation ✅

- [x] Task 2: Add delete server action (AC: 3)
  - [x] 2.1: Create deleteMoodEntry action ✅
  - [x] 2.2: Add ownership verification ✅

- [x] Task 3: Add getMoodEntries action (for history)
  - [x] 3.1: Create getMoodEntries with pagination ✅
  - [x] 3.2: Add date range filter (days param) ✅
  - [x] 3.3: Cursor-based pagination ✅

- [x] Task 4: Update QuickEntryModal for edit mode (AC: 1, 2, 5)
  - [x] 4.1: Update store with editingEntry ✅
  - [x] 4.2: Initialize form with existing values ✅
  - [x] 4.3: Use updateMoodEntry when editing ✅
  - [x] 4.4: TanStack Query cache invalidation ✅

- [x] Task 5: Add delete with confirmation (AC: 3, 4)
  - [x] 5.1: Delete button in edit mode ✅
  - [x] 5.2: dialogManager.confirm for confirmation ✅
  - [x] 5.3: Kind message (no guilt) ✅

- [x] Task 6: Add i18n translations
  - [x] 6.1: editTitle, update, updated ✅
  - [x] 6.2: delete, deleted, deleteTitle, deleteDescription, deleteConfirm ✅

## Dev Notes

### Technical Context
- Server actions use authAction for authentication
- ActionError for ownership verification errors
- dialogManager for delete confirmation
- TanStack Query for cache invalidation

### Security
- All actions verify user ownership before modify/delete
- ActionError thrown for unauthorized access attempts

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- Fixed ESLint: removed unnecessary `&& editingEntry` condition

### Completion Notes List
- updateMoodEntry with ownership check
- deleteMoodEntry with ownership check
- getMoodEntries with pagination and date filter
- QuickEntryModal supports edit mode
- Delete confirmation via dialogManager
- Kind confirmation messages
- i18n translations (FR + EN)
- TypeScript check passed

### File List
- `src/features/mood/mood.action.ts` - CRUD server actions
- `src/features/mood/quick-entry-store.ts` - Updated with editingEntry
- `src/components/nowts/quick-entry-modal.tsx` - Edit/delete support
- `src/i18n/messages/en.ts` - English translations
- `src/i18n/messages/fr.ts` - French translations
