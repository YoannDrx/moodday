# Story 2.3: Quick Entry Modal

Status: done

## Story

As a **user**,
I want **a quick modal to enter my mood and an optional note**,
so that **I can complete my check-in in less than 30 seconds**.

## Acceptance Criteria

1. Modal accessible via FAB (Bottom Nav)
2. MoodSlider integrated
3. Optional text area for free note
4. "Save" button visible and accessible
5. Smooth open/close animation
6. Close on tap outside or swipe down
7. Total entry time < 30 seconds (NFR-P1)

## Status Update (2026-01-23)

- ✅ Modal monte dans le layout patient.
- ✅ FAB mobile connecte a l'ouverture du modal.
- ✅ Quick entry utilisable end-to-end.

## Tasks / Subtasks

- [x] Task 1: Create Zustand store for modal (AC: 1)
  - [x] 1.1: Create quick-entry-store.ts ✅
  - [x] 1.2: Implement open/close/toggle actions ✅

- [x] Task 2: Create server action (AC: 4)
  - [x] 2.1: Create mood.action.ts ✅
  - [x] 2.2: Implement createMoodEntry with Zod validation ✅

- [x] Task 3: Create QuickEntryModal component (AC: 2, 3, 4, 5, 6)
  - [x] 3.1: Create nowts/quick-entry-modal.tsx ✅
  - [x] 3.2: Integrate MoodSlider ✅
  - [x] 3.3: Add optional Textarea ✅
  - [x] 3.4: Submit button with loading state ✅
  - [x] 3.5: Backdrop click to close ✅
  - [x] 3.6: Smooth animations (slide-in-from-bottom) ✅

- [x] Task 4: Add i18n translations
  - [x] 4.1: Add mood.entry.* keys in en.ts ✅
  - [x] 4.2: Add mood.entry.* keys in fr.ts ✅

## Dev Notes

### Technical Context
- Zustand store for modal state management
- useMutation for server action with optimistic UI
- TanStack Query for cache invalidation

### Modal Features
- Glass-morphism style (backdrop-blur, semi-transparent)
- Slide-in-from-bottom animation
- Character counter for note (500 max)
- Reset form on successful save

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- Fixed ESLint: `??` instead of `||` in mood.action.ts

### Completion Notes List
- Zustand store for modal state
- Server action with Zod validation
- QuickEntryModal with MoodSlider
- Optional note with character counter
- Smooth animations
- i18n translations (FR + EN)
- TypeScript check passed

### File List
- `src/features/mood/mood.action.ts` - createMoodEntry server action
- `src/features/mood/quick-entry-store.ts` - Zustand modal store
- `src/components/nowts/quick-entry-modal.tsx` - Modal component
- `src/i18n/messages/en.ts` - English translations
- `src/i18n/messages/fr.ts` - French translations
