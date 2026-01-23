# Story 3.2: Add Medication Form

Status: completed

## Story

As a **user**,
I want **to add a new medication with its name, dosage and frequency**,
so that **I can set up my medication tracking**.

## Acceptance Criteria

1. Form: name, dosage (free text), frequency (select)
2. Frequency options: daily, twice daily, weekly, PRN
3. Checkbox "PRN medication (as needed)"
4. Zod field validation
5. Kind success message
6. Redirect to list after adding

## Status Update (2026-01-22)

- ✅ Form is wired to `createMedication` and works end-to-end.

## Tasks / Subtasks

- [x] Task 1: Create medication server actions
  - [x] 1.1: createMedication with Zod validation ✅
  - [x] 1.2: updateMedication with ownership check ✅
  - [x] 1.3: archiveMedication/unarchiveMedication ✅
  - [x] 1.4: getMedications with archive filter ✅
  - [x] 1.5: getMedicationById ✅

- [x] Task 2: Create add medication page (AC: 1, 2, 3)
  - [x] 2.1: Create page at /medications/new ✅
  - [x] 2.2: AddMedicationForm component ✅
  - [x] 2.3: Name, dosage, frequency fields ✅
  - [x] 2.4: isPRN checkbox ✅

- [x] Task 3: Form validation (AC: 4)
  - [x] 3.1: Zod schema with useZodForm ✅
  - [x] 3.2: Required field validation ✅

- [x] Task 4: Success handling (AC: 5, 6)
  - [x] 4.1: Toast success message ✅
  - [x] 4.2: Redirect to /medications ✅

- [x] Task 5: Add i18n translations
  - [x] 5.1: medication.* keys in en.ts ✅
  - [x] 5.2: medication.* keys in fr.ts ✅

## Dev Notes

### Technical Context
- Uses project's custom useZodForm hook
- Form component with form/onSubmit props
- Server actions in src/features/medication/

### Frequency Values
- `daily` - Once per day
- `twice_daily` - Twice per day
- `weekly` - Once per week
- `prn` - As needed

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- Fixed ESLint: `||` instead of `??` for isPRN
- Fixed TypeScript: used useZodForm instead of useForm with zodResolver

### Completion Notes List
- Server actions for all CRUD operations
- Add medication form with validation
- Frequency select with all options
- isPRN checkbox auto-set when prn frequency
- i18n translations (FR + EN)
- TypeScript check passed

### File List
- `src/features/medication/medication.action.ts` - Server actions
- `app/(logged-in)/medications/new/page.tsx` - Add page
- `app/(logged-in)/medications/new/_components/add-medication-form.tsx` - Form
- `src/i18n/messages/en.ts` - English translations
- `src/i18n/messages/fr.ts` - French translations
