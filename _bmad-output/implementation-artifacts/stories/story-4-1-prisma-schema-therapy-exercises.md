# Story 4.1: Prisma Schema Therapy & Exercises

Status: completed

## Story

As a **developer**,
I want **to create the TherapySession, Exercise and ExerciseLog models**,
so that **I can store therapy notes and wellness exercises**.

## Acceptance Criteria

1. Model TherapySession: id, userId, date, notes, benefitRating (1-5), createdAt
2. Model Exercise: id, userId, name, description, isArchived
3. Model ExerciseLog: id, exerciseId, completedAt, note
4. Relations and cascade delete
5. Migration executed

## Status Update (2026-01-22)

- ✅ Schema + server actions exist and are in use.

## Tasks / Subtasks

- [x] Task 1: Create Prisma models
  - [x] 1.1: TherapySession model ✅
  - [x] 1.2: Exercise model ✅
  - [x] 1.3: ExerciseLog model ✅
  - [x] 1.4: Add relations to User model ✅

- [x] Task 2: Run migration
  - [x] 2.1: prisma db push ✅
  - [x] 2.2: Regenerate Prisma client ✅

- [x] Task 3: Create server actions
  - [x] 3.1: Therapy session CRUD ✅
  - [x] 3.2: Exercise CRUD ✅
  - [x] 3.3: Exercise log actions ✅

## Dev Notes

### Technical Context
- Used prisma db push for development sync
- Added syncStatus for offline support readiness
- All actions verify ownership before operations

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- No issues encountered

### Completion Notes List
- TherapySession, Exercise, ExerciseLog models
- User relations added
- Full server actions for both features
- TypeScript check passed

### File List
- `prisma/schema/schema.prisma` - Added models
- `prisma/schema/better-auth.prisma` - User relations
- `src/features/therapy/therapy.action.ts` - Therapy actions
- `src/features/exercise/exercise.action.ts` - Exercise actions
