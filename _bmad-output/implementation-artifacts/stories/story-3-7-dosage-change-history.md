# Story 3.7: Dosage Change History

Status: completed

## Story

As a **user**,
I want **to see the history of dosage changes for my medications**,
so that **I can correlate with my mood evolution**.

## Acceptance Criteria

1. Timeline of changes for each medication
2. Display: date, old dosage → new dosage, reason
3. Automatic history creation on dosage change
4. Data available for chart (Epic 5)

## Status Update (2026-01-22)

- ✅ Dosage history is recorded and displayed in medication detail.

## Tasks / Subtasks

- [x] Task 1: Automatic history creation (AC: 3)
  - [x] 1.1: Already implemented in updateMedication ✅
  - [x] 1.2: Creates MedicationHistory on dosage change ✅
  - [x] 1.3: Stores previousDosage and reason ✅

- [x] Task 2: Create DosageTimeline component (AC: 1, 2)
  - [x] 2.1: Visual timeline with dots and line ✅
  - [x] 2.2: Show old → new dosage with arrow ✅
  - [x] 2.3: Display reason and date ✅
  - [x] 2.4: Highlight current dosage ✅

- [x] Task 3: Integrate in medication detail page
  - [x] 3.1: Replace inline history with DosageTimeline ✅

- [x] Task 4: Add i18n translations
  - [x] 4.1: medication.dosageHistory.* keys ✅

## Dev Notes

### Technical Context
- History creation was already done in Story 3.2/3.4
- This story improves the visual presentation
- DosageTimeline is reusable component

### Data for Epic 5
- MedicationHistory data will be used in mood charts
- API already returns history with getMedicationById

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.7]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- Fixed missing CardTitle import

### Completion Notes List
- DosageTimeline component with visual timeline
- Old → new dosage display with arrow
- Integrated in medication detail page
- i18n translations (FR + EN)
- TypeScript check passed

### File List
- `src/components/nowts/dosage-timeline.tsx` - Timeline component
- `app/(logged-in)/medications/[id]/_components/medication-detail.tsx` - Updated
- `src/i18n/messages/en.ts` - English translations
- `src/i18n/messages/fr.ts` - French translations
