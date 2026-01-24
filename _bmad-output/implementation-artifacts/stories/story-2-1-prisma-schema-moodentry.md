# Story 2.1: Prisma Schema MoodEntry

Status: completed

## Story

As a **developer**,
I want **to create the MoodEntry model in Prisma**,
so that **I can store user mood entries**.

## Acceptance Criteria

1. Model MoodEntry created in schema.prisma
2. Fields: id, userId, value (0-10), note (optional), createdAt, updatedAt
3. Field syncStatus for offline: 'pending' | 'synced' | 'conflict'
4. Relation with User (cascade delete)
5. Migration executed successfully

## Status Update (2026-01-22)

- ✅ Schema exists in `prisma/schema/schema.prisma`.
- ✅ Extended fields (energy/sleep/tags/sideEffects) now persisted via JournalWizard.
- ⚠️ Anxiety score field exists but is not exposed in UI.

## Tasks / Subtasks

- [x] Task 1: Create MoodEntry model (AC: 1, 2, 3)
  - [x] 1.1: Add model in schema.prisma ✅
  - [x] 1.2: Add id (cuid), userId, value (Int 0-10) ✅
  - [x] 1.3: Add note (optional String) ✅
  - [x] 1.4: Add syncStatus (default "synced") ✅
  - [x] 1.5: Add createdAt, updatedAt ✅

- [x] Task 2: Configure relation (AC: 4)
  - [x] 2.1: Add user relation with onDelete Cascade ✅
  - [x] 2.2: Add moodEntries relation to User model ✅
  - [x] 2.3: Add indexes on userId and createdAt ✅

- [x] Task 3: Execute migration (AC: 5)
  - [x] 3.1: Generate Prisma client ✅
  - [x] 3.2: Push schema to database ✅

## Dev Notes

### Technical Context
- Using Prisma schema folder feature
- Schema split: better-auth.prisma (User) + schema.prisma (app models)
- Using `db push` for schema sync (development)

### Schema Definition
```prisma
model MoodEntry {
  id         String   @id @default(cuid())
  userId     String
  value      Int      // 0-10 scale
  note       String?  // Optional free-text note
  syncStatus String   @default("synced") // 'pending' | 'synced' | 'conflict'

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
  @@map("mood_entry")
}
```

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1]
- [Source: _bmad-output/planning-artifacts/architecture.md]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- Used `prisma db push` instead of `migrate dev` (non-interactive environment)

### Completion Notes List
- MoodEntry model created with all required fields
- Indexes added for query performance
- Table mapped to snake_case (mood_entry)
- Relation added to User model in better-auth.prisma
- Schema synchronized with database

### File List
- `prisma/schema/schema.prisma` - MoodEntry model
- `prisma/schema/better-auth.prisma` - Added moodEntries relation to User
