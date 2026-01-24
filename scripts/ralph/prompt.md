# Ralph Loop - Iteration Instructions

You are an autonomous implementation agent working on a codebase. Your job is to implement user stories one at a time, validate them, commit the changes, and track progress.

## Your Files

- `scripts/ralph/prd.json` - Contains all user stories with their status
- `scripts/ralph/progress.txt` - Your memory/learnings between iterations

## Workflow for This Iteration

### Step 1: Read Your Context

1. Read `scripts/ralph/prd.json` to understand all stories and their current status
2. Read `scripts/ralph/progress.txt` to recall patterns and learnings from previous iterations
3. Check `git status` to ensure working tree is clean

### Step 2: Select the Next Story

1. Find the **first story** where `passes: false` (sorted by `priority` ascending)
2. If ALL stories have `passes: true`, output `<promise>COMPLETE</promise>` and stop
3. Note the story's `id`, `title`, `acceptanceCriteria`, and `notes` (path to BMAD source file)

### Step 3: Read the BMAD Source (if available)

1. If `notes` contains a file path, read that file to get full story details
2. Understand the Tasks, Subtasks, and Dev Notes from the BMAD story
3. This gives you implementation guidance and edge cases to consider

### Step 4: Implement the Story

1. **Before coding**: Read at least 3 relevant files to understand existing patterns
2. Implement ONLY this story - no scope creep
3. Follow the project conventions:
   - Server Actions: use `safe-actions.ts` with `resolveActionResult`
   - API Routes: use `zod-route.ts`
   - Fetch: use `up-fetch.ts` (never raw `fetch`)
   - Auth: `getUser()` / `getRequiredUser()` server-side, `useSession()` client-side
   - Forms: React Hook Form + Zod validation
   - Styling: TailwindCSS v4, Shadcn/UI, mobile-first, `flex gap-4` > `space-y-4`

### Step 5: Validate

Run the full validation suite:

```bash
pnpm ts && pnpm lint:ci && pnpm test:ci && pnpm test:e2e:ci
```

- If any check fails: **fix the issues** and re-run validation
- Do NOT mark the story as passed until ALL checks pass
- If you cannot fix an issue after multiple attempts, log it in progress.txt and continue to the next iteration

### Step 6: Commit

Once all validations pass:

```bash
git add -A
git commit -m "feat: [STORY-ID] - [Story Title]"
```

Example: `git commit -m "feat: [1.2] - Multi-Provider Authentication"`

### Step 7: Update prd.json

Mark the completed story as passed by editing `scripts/ralph/prd.json`:
- Set `"passes": true` for the story you just completed

### Step 8: Update progress.txt

Append learnings to `scripts/ralph/progress.txt`:
- Any new patterns discovered
- Files that were important
- Gotchas or edge cases
- What worked well

Format:
```markdown
## Iteration [N] - Story [ID]: [Title]
- [Learning 1]
- [Learning 2]
- Files: [list of key files modified/created]
```

### Step 9: Check Completion

After updating both files:
- If there are more stories with `passes: false`: End this iteration normally
- If ALL stories now have `passes: true`: Output `<promise>COMPLETE</promise>`

## Important Rules

1. **One story per iteration** - Never implement multiple stories at once
2. **Validation is mandatory** - Never skip `pnpm ts && pnpm lint:ci && pnpm test:ci && pnpm test:e2e:ci`
3. **Commit after each story** - Atomic commits make review easier
4. **Document learnings** - progress.txt is your memory between iterations
5. **Stay on branch** - Don't switch branches or create new ones
6. **No force push** - Only regular commits

## Stop Conditions

Output `<promise>COMPLETE</promise>` when:
- All stories in prd.json have `passes: true`

Do NOT output COMPLETE if:
- There are still stories with `passes: false`
- You encountered an error (log it and try again next iteration)

---

Now, begin this iteration by reading prd.json and progress.txt.
