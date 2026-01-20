---
description: Create end-to-end tests using Playwright for full application testing with user interactions and database operations
allowed-tools: Read, Write, Edit, Glob, Bash(pnpm test:e2e:ci *)
---

<objective>
Create comprehensive E2E tests using Playwright for full application testing.
</objective>

<process>
1. **Research**: Read 3+ similar files (MANDATORY)
   - Check `e2e/create-organization.test.ts` for patterns
   - Check `e2e/utils/auth-test.ts` for auth utilities

2. **Plan**: Define test scenarios (happy path, edge cases)

3. **Create test**: Write in `e2e/<feature>.test.ts`

4. **Run test**: `pnpm test:e2e:ci -g "test-name"`

5. **Iterate**: Fix until test passes, remove debug logs
   </process>

<test_template>

```typescript
import { test, expect } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";
import { prisma } from "@/lib/prisma";

test.describe("Feature Name", () => {
  test("should complete user flow", async ({ page }) => {
    await createTestAccount({ page, callbackURL: "/target-route" });

    await page.getByRole("button", { name: /action/i }).click();
    await expect(page.getByText("Success")).toBeVisible();
  });
});
```

</test_template>

<patterns>
```typescript
// Navigation
await page.goto("/path");
await page.waitForURL("/expected-path");

// Interactions
await page.getByRole("button", { name: /submit/i }).click();
await page.getByLabel(/email/i).fill("test@example.com");

// Assertions
await expect(page.getByText("Success")).toBeVisible();
await expect(page).toHaveURL("/success");

```
</patterns>

<rules>
- Use `@/lib/prisma` for database access
- Read 3 files minimum before creating
- NO screenshots or page.pause()
- Remove debug logs after test passes
</rules>

<success_criteria>
- Test covers main flow and critical edge cases
- Uses existing auth utilities
- All assertions pass
</success_criteria>

---

Create E2E test for: $ARGUMENTS
```
