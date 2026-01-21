# Setup Ralph - BMAD Story Extractor

Setup the Ralph autonomous implementation loop by extracting stories from BMAD.

## Usage

```bash
/setup-ralph              # All ready-for-dev stories
/setup-ralph epic-1       # Only Epic 1 (Authentication)
/setup-ralph epic-2       # Only Epic 2 (Mood Tracking)
```

## Your Task

Extract user stories from BMAD artifacts and generate Ralph configuration files.

### Step 1: Parse Arguments

Check if `$ARGUMENTS` contains an Epic filter:
- `epic-1`, `epic-2`, etc. → Filter to that Epic only
- Empty → Include all Epics

### Step 2: Find BMAD Stories

Scan for story files:
```
_bmad-output/implementation-artifacts/stories/story-*.md
```

### Step 3: Parse Each Story

For each story file, extract:
- **ID**: From filename or `# Story X.Y` title (e.g., `1.2`)
- **Title**: The story title
- **Status**: Look for `Status: ready-for-dev`, `pending`, `completed`, etc.
- **Acceptance Criteria**: The bullet points under `## Acceptance Criteria`
- **Epic Number**: First digit of the ID (e.g., `1.2` → Epic 1)

Only include stories where status is NOT `completed`.

### Step 4: Calculate Priority

```
priority = (epicNumber * 100) + storyNumber
```

Examples:
- Story 1.2 → priority 102
- Story 2.3 → priority 203
- Story 3.1 → priority 301

### Step 5: Determine Branch Name

Based on the Epic filter or the first Epic with stories:

| Epic | Branch Name |
|------|-------------|
| 1 | `ralph/epic-1-auth` |
| 2 | `ralph/epic-2-mood` |
| 3 | `ralph/epic-3-insights` |
| 4 | `ralph/epic-4-reminders` |
| 5 | `ralph/epic-5-dashboard` |
| 6 | `ralph/epic-6-settings` |
| 7 | `ralph/epic-7-polish` |
| 8 | `ralph/epic-8-launch` |
| (all) | `ralph/all-epics` |

### Step 6: Generate prd.json

Create `scripts/ralph/prd.json`:

```json
{
  "branchName": "ralph/epic-1-auth",
  "generatedAt": "2025-01-21T12:00:00Z",
  "epicFilter": "epic-1",
  "userStories": [
    {
      "id": "1.2",
      "title": "Multi-Provider Authentication",
      "acceptanceCriteria": [
        "Email/password registration with email verification",
        "Google OAuth login works correctly",
        "GitHub OAuth login works correctly",
        "Forms validated with Zod",
        "Kind, non-judgmental error messages",
        "Post-login redirect to dashboard",
        "pnpm ts passes",
        "pnpm lint:ci passes",
        "pnpm test:ci passes",
        "pnpm test:e2e:ci passes"
      ],
      "priority": 102,
      "passes": false,
      "notes": "_bmad-output/implementation-artifacts/stories/story-1-2-multi-provider-auth.md"
    }
  ]
}
```

**Important**: Always add these automated checks to `acceptanceCriteria`:
- `pnpm ts passes`
- `pnpm lint:ci passes`
- `pnpm test:ci passes`
- `pnpm test:e2e:ci passes`

### Step 7: Generate progress.txt

Create `scripts/ralph/progress.txt` with codebase patterns:

```markdown
# Ralph Progress Log

Started: [CURRENT_DATE]
Epic Filter: [epic-X or "all"]
Branch: [branchName]

## Codebase Patterns

These patterns were extracted from CLAUDE.md and should be followed:

### Server Actions
- Use `@/lib/actions/safe-actions.ts` for all server actions
- Use `resolveActionResult` helper for mutations
- File naming: `*.action.ts`

### API Routes
- Use `@/lib/zod-route.ts` for all API routes
- Always read zod-route.ts before creating routes

### Data Fetching
- Use `@/lib/up-fetch.ts` (never raw `fetch`)

### Authentication
- Server: `getUser()` (optional) or `getRequiredUser()` (required)
- Client: `useSession()` from auth-client.ts

### Forms
- React Hook Form + Zod validation
- Follow patterns in `/src/features/form/`

### Styling
- TailwindCSS v4 with Shadcn/UI
- Mobile-first approach
- Use `flex gap-4` instead of `space-y-4`
- Use Card component for wrappers

### TypeScript
- Use `type` not `interface`
- Use `??` not `||`
- Strict mode enabled

## Key Files

- `src/lib/auth.ts` - Auth configuration
- `src/lib/actions/safe-actions.ts` - Server actions wrapper
- `src/lib/zod-route.ts` - API route helper
- `src/lib/up-fetch.ts` - Fetch wrapper
- `prisma/schema.prisma` - Database schema
- `src/site-config.ts` - Site configuration
- `src/components/ui/` - Shadcn UI components
- `src/features/dialog-manager/` - Global dialog system

## Iteration Log

---
```

### Step 8: Create/Checkout Branch

```bash
# Check if branch exists
git show-ref --verify --quiet refs/heads/[branchName] && \
  git checkout [branchName] || \
  git checkout -b [branchName]
```

### Step 9: Make ralph.sh Executable

```bash
chmod +x scripts/ralph/ralph.sh
```

### Step 10: Summary Output

Display:
- Number of stories extracted
- Epic filter applied (if any)
- Branch name
- Path to generated files
- Next steps (how to run `/ralph`)

## Output Format

```
✅ Ralph Setup Complete!

📊 Stories: X stories extracted
🎯 Epic: [epic-X or "All Epics"]
🌿 Branch: [branchName]

📁 Generated files:
   - scripts/ralph/prd.json
   - scripts/ralph/progress.txt

🚀 Next steps:
   1. Review the stories: cat scripts/ralph/prd.json | jq .
   2. Start the loop: /ralph [iterations]
   3. Or manually: ./scripts/ralph/ralph.sh [iterations]
```

## Error Handling

- If no BMAD stories found: Show error and suggest running BMAD workflows first
- If Epic filter matches no stories: Show available Epics
- If git working tree is dirty: Warn user to commit or stash changes first
