---
description: Safely rename database tables or columns by replacing Prisma's destructive DROP/ADD operations with RENAME operations
allowed-tools: Bash(pnpm *), Read, Edit, Glob
---

<objective>
Fix Prisma's destructive migrations when renaming columns or tables to preserve data.
</objective>

<problem>
Prisma generates destructive migrations:
```sql
ALTER TABLE "Post" DROP COLUMN "content", ADD COLUMN "markdown" TEXT NOT NULL;
```
This DELETES all data!
</problem>

<solution>
Replace with non-destructive RENAME:
```sql
ALTER TABLE "Post" RENAME COLUMN "content" TO "markdown";
```
</solution>

<process>
1. **Generate**: `pnpm prisma migrate dev --name <name> --create-only`
2. **Locate**: Find migration in `prisma/schema/migrations/<timestamp>_<name>/migration.sql`
3. **Fix**: Replace DROP/ADD with RENAME operations
4. **Review**: Verify no data loss
5. **Apply**: `pnpm prisma migrate deploy`
</process>

<success_criteria>

- Migration uses RENAME instead of DROP/ADD
- Data preserved after migration
- Schema correctly updated
  </success_criteria>

---

Fix migration for: $ARGUMENTS
