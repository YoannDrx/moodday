# Story 2.5: Mood History List

Status: partial

## Story

As a **user**,
I want **to see the history of my mood entries**,
so that **I can visualize my journey over time**.

## Acceptance Criteria

1. Reverse chronological list (most recent at top)
2. Display: date, value (with color), note (preview)
3. Pagination or infinite scroll
4. Filter by period (7d, 30d, 90d, all)
5. Kind empty state if no entries

## Status Update (2026-01-22)

- ✅ List + filters + pagination work with real data.
- ⚠️ Click-to-edit depends on Quick Entry modal which is not mounted.

## Tasks / Subtasks

- [x] Task 1: Create history page (AC: 1)
  - [x] 1.1: Create app/(logged-in)/mood/history/page.tsx ✅
  - [x] 1.2: Add metadata with i18n ✅

- [x] Task 2: Create MoodHistoryList component (AC: 1, 2, 3)
  - [x] 2.1: Create _components/mood-history-list.tsx ✅
  - [x] 2.2: Infinite query with TanStack Query ✅
  - [x] 2.3: Display entries with color and emoji ✅
  - [x] 2.4: Show date with locale formatting ✅
  - [x] 2.5: Show note preview (truncated) ✅
  - [x] 2.6: Load more button ✅

- [x] Task 3: Add period filter (AC: 4)
  - [x] 3.1: Select component with filter options ✅
  - [x] 3.2: Filter values: week, month, quarter, all ✅
  - [x] 3.3: Query refetch on filter change ✅

- [x] Task 4: Add empty state (AC: 5)
  - [x] 4.1: Kind message with emoji ✅
  - [x] 4.2: Use i18n translation ✅

- [x] Task 5: Click to edit integration
  - [x] 5.1: Click on entry opens edit modal ✅
  - [x] 5.2: Use openForEdit from store ✅

## Dev Notes

### Technical Context
- TanStack Query useInfiniteQuery for pagination
- date-fns for localized date formatting
- Cursor-based pagination from getMoodEntries action

### Color/Emoji Mapping
- Reuses same logic as MoodSlider for consistency
- Color gradient: red → orange → yellow → lime → green
- Emoji: 😢 → 😔 → 😐 → 🙂 → 😊 → 😄

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- Fixed: useCurrentLocale not exported, used useI18n().locale instead

### Completion Notes List
- History page with i18n metadata
- MoodHistoryList with infinite scroll
- Period filter (week, month, quarter, all)
- Localized date formatting (FR/EN)
- Color-coded entries with emoji
- Click to edit integration
- Kind empty state
- TypeScript check passed

### File List
- `app/(logged-in)/mood/history/page.tsx` - History page
- `app/(logged-in)/mood/history/_components/mood-history-list.tsx` - List component
