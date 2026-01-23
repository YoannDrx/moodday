# Story 3.1: Prisma Schema Medications

Status: completed

## Story

As a **developer**,
I want **to create the Medication, MedIntake and MedicationHistory models**,
so that **I can store medications and their intakes**.

## Acceptance Criteria

1. Model Medication: id, userId, name, dosage, frequency, isPRN, isArchived, createdAt
2. Model MedIntake: id, medicationId, takenAt, skipped, note
3. Model MedicationHistory: id, medicationId, dosage, changedAt, reason
4. Correct relations with cascade delete
5. Migration executed

## Status Update (2026-01-22)

- ✅ Schema exists and is in active use by medication features.

## Tasks / Subtasks

- [x] Task 1: Create Medication model (AC: 1)
  - [x] 1.1: Add id, userId, name, dosage, frequency ✅
  - [x] 1.2: Add isPRN, isArchived, syncStatus ✅
  - [x] 1.3: Add timestamps ✅
  - [x] 1.4: Add relation to User (cascade) ✅
  - [x] 1.5: Add indexes ✅

- [x] Task 2: Create MedIntake model (AC: 2)
  - [x] 2.1: Add id, medicationId, takenAt, skipped, note ✅
  - [x] 2.2: Add relation to Medication (cascade) ✅
  - [x] 2.3: Add indexes ✅

- [x] Task 3: Create MedicationHistory model (AC: 3)
  - [x] 3.1: Add id, medicationId, dosage, previousDosage, reason ✅
  - [x] 3.2: Add changedAt timestamp ✅
  - [x] 3.3: Add relation to Medication (cascade) ✅
  - [x] 3.4: Add indexes ✅

- [x] Task 4: Add User relations (AC: 4)
  - [x] 4.1: Add medications relation to User ✅

- [x] Task 5: Execute migration (AC: 5)
  - [x] 5.1: Generate Prisma client ✅
  - [x] 5.2: Push schema to database ✅

- [x] Task 6: Update data export
  - [x] 6.1: Include medications in exportUserData ✅
  - [x] 6.2: Include intakes and history ✅

## Dev Notes

### Schema Definition
```prisma
model Medication {
  id         String   @id @default(cuid())
  userId     String
  name       String
  dosage     String   // e.g., "50mg", "1 comprimé"
  frequency  String   // "daily", "twice_daily", "weekly", "prn"
  isPRN      Boolean  @default(false)
  isArchived Boolean  @default(false)
  syncStatus String   @default("synced")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  user       User     @relation(...)
  intakes    MedIntake[]
  history    MedicationHistory[]
}
```

### Frequency Values
- `daily` - Once per day
- `twice_daily` - Twice per day
- `weekly` - Once per week
- `prn` - As needed (Pro Re Nata)

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- No issues encountered

### Completion Notes List
- Medication model with all fields
- MedIntake for logging intakes
- MedicationHistory for dosage tracking
- Cascade delete configured
- Data export updated to include medications
- TypeScript check passed

### File List
- `prisma/schema/schema.prisma` - Medication models
- `prisma/schema/better-auth.prisma` - Added medications relation to User
- `src/features/account/export-data.action.ts` - Updated export
