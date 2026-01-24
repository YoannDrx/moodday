# Story 3.3: Medication List View

Status: completed

## Story

As a **user**,
I want **to see a list of all my medications with their status**,
so that **I can quickly check what I need to take**.

## Acceptance Criteria

1. List showing all active medications
2. Each card shows: name, dosage, frequency
3. Visual indicator for today's intake status
4. PRN badge for as-needed medications
5. Toggle to show/hide archived medications
6. Empty state when no medications

## Status Update (2026-01-22)

- ✅ List view works with real data (including archived toggle).

## Tasks / Subtasks

- [x] Task 1: Create medications list page
  - [x] 1.1: Create page at /medications ✅
  - [x] 1.2: Page layout with title ✅

- [x] Task 2: Create MedicationList component (AC: 1, 6)
  - [x] 2.1: Fetch medications with useQuery ✅
  - [x] 2.2: Loading skeleton state ✅
  - [x] 2.3: Error state ✅
  - [x] 2.4: Empty state with icon ✅

- [x] Task 3: Create MedicationCard component (AC: 2, 3, 4)
  - [x] 3.1: Display name, dosage, frequency ✅
  - [x] 3.2: PRN badge for isPRN medications ✅
  - [x] 3.3: Today's intake status indicator ✅
  - [x] 3.4: Click to navigate to detail page ✅

- [x] Task 4: Archived medications toggle (AC: 5)
  - [x] 4.1: Switch to show/hide archived ✅
  - [x] 4.2: Separate section for archived meds ✅
  - [x] 4.3: Visual distinction (opacity) ✅

- [x] Task 5: Add button
  - [x] 5.1: Link to /medications/new ✅

## Dev Notes

### Technical Context
- Uses TanStack Query for data fetching
- Server action getMedications with includeArchived filter
- Cards link to /medications/[id] detail page

### Frequency Display
- Uses FREQUENCY_LABELS map with i18n keys
- Translates frequency values to user-friendly labels

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- No issues encountered

### Completion Notes List
- List page with active/archived sections
- MedicationCard with status indicators
- Today's intake check (hasTakenToday)
- PRN badge display
- Archive toggle with Switch component
- Empty state with Pill icon
- i18n translations used throughout

### File List
- `app/(logged-in)/medications/page.tsx` - List page
- `app/(logged-in)/medications/_components/medication-list.tsx` - List component
