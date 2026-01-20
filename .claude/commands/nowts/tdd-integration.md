---
description: Build React components with Test-Driven Development using Playwright integration tests with database and real functionality
allowed-tools: Read, Write, Edit, Glob, Bash(pnpm test:e2e:ci *)
---

<objective>
Build React components using TDD with Playwright integration tests. Write tests FIRST, then implement.
</objective>

<process>
1. **Research**: Read 3+ similar files (MANDATORY)
   - Check `e2e/create-organization.test.ts` for patterns
   - Check `e2e/utils/auth-test.ts` for auth utilities

2. **Plan**: Define component structure and database operations

3. **Create test**: Write integration test FIRST in `e2e/<feature>.test.ts`

4. **Create component**: Implement in `src/features/` or `src/components/`

5. **Run test**: `pnpm test:e2e:ci -g "test-name"`

6. **Iterate**: Fix until test passes
   </process>

<test_template>

```typescript
import { test, expect } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";
import { prisma } from "@/lib/prisma";

test.describe("Feature Name", () => {
  test("should do something", async ({ page }) => {
    await createTestAccount({ page, callbackURL: "/target-url" });
    // Test interactions and assertions
  });
});
```

</test_template>

<utilities>
- `createTestAccount({ page, callbackURL, admin? })` - Create and login test user
- `signInAccount({ page, userData, callbackURL })` - Login existing user
- `prisma` from `@/lib/prisma` - Database operations
</utilities>

<rules>
- Write test FIRST - no exceptions
- Read 3 files minimum before creating components
- Use `PageProps<"/route/path">` for page components
- NO screenshots or page.pause()
- Organization routes in `/orgs/[orgSlug]`
</rules>

<success_criteria>

- Test written before component
- Component follows existing patterns
- Test passes
  </success_criteria>

---

Create integration test for: $ARGUMENTS
