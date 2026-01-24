# Ralph - Autonomous Implementation Loop

Launch the Ralph autonomous implementation loop to process user stories.

## Usage

```bash
/ralph              # Default: 50 iterations
/ralph 25           # Custom: 25 iterations max
```

## Prerequisites

Before running Ralph, ensure:

1. **Setup completed**: Run `/setup-ralph` first to generate configuration files
2. **Git clean**: Working tree should be clean (all changes committed or stashed)
3. **Correct branch**: You should be on the Ralph branch (`ralph/epic-*`)
4. **Dev server** (optional): If E2E tests are included, run `pnpm dev` in another terminal

## Your Task

### Step 1: Verify Setup

Check that required files exist:
- `scripts/ralph/ralph.sh`
- `scripts/ralph/prd.json`
- `scripts/ralph/progress.txt`
- `scripts/ralph/prompt.md`

If any file is missing, instruct the user to run `/setup-ralph` first.

### Step 2: Check Git Status

```bash
git status --porcelain
```

If working tree is dirty, warn the user and ask if they want to continue.

### Step 3: Verify Branch

```bash
git branch --show-current
```

Check that current branch matches `branchName` in `prd.json`. Warn if different.

### Step 4: Show Pre-Launch Summary

Display:
- Current branch
- Stories status (X/Y completed)
- Max iterations from `$ARGUMENTS` (default: 50)
- Validation commands that will run

### Step 5: Launch the Loop

Run the Ralph script:

```bash
./scripts/ralph/ralph.sh [iterations]
```

Where `[iterations]` comes from `$ARGUMENTS` or defaults to 50.

### Step 6: Monitor Output

The script will:
1. Run Claude Code in a loop
2. Process one story per iteration
3. Stop when all stories pass or max iterations reached
4. Output progress after each iteration

### Step 7: Post-Run Summary

After the loop completes, display:
- Final story status
- Recent commits made
- Any learnings from progress.txt
- Next steps (PR creation, manual testing, etc.)

## Output Format

### Pre-Launch
```
🚀 Ralph Loop - Pre-Launch Check

📋 Configuration:
   - Branch: ralph/epic-1-auth
   - Stories: 2/6 completed (4 remaining)
   - Max iterations: 25

✅ All prerequisites met. Launching Ralph...
```

### Post-Run
```
✅ Ralph Loop Complete!

📊 Final Status: 6/6 stories completed
🎉 All stories passed!

📝 Recent commits:
   abc1234 feat: [1.6] - Session Management
   def5678 feat: [1.5] - Password Reset Flow
   ...

🚀 Next steps:
   1. Review changes: git log --oneline -10
   2. Run full test suite: pnpm test:ci && pnpm test:e2e:ci
   3. Create PR: /create-pull-request
```

## Error Handling

- **Missing setup files**: Direct user to run `/setup-ralph`
- **Dirty working tree**: Warn and offer to continue or abort
- **Wrong branch**: Warn and offer to switch or continue
- **Script not executable**: Run `chmod +x scripts/ralph/ralph.sh`
- **Claude CLI not found**: Provide installation instructions

## Important Notes

1. **Don't interrupt**: Let each iteration complete before stopping
2. **Check progress**: Use `cat scripts/ralph/prd.json | jq '.userStories[] | {id, passes}'`
3. **View learnings**: Check `scripts/ralph/progress.txt` for accumulated patterns
4. **Resume safely**: Running `/ralph` again will continue from where it left off
