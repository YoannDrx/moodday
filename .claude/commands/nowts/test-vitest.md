---
description: Create unit tests for React components using Vitest and React Testing Library for isolated component testing
allowed-tools: Read, Write, Edit, Glob, Bash(pnpm test:ci *)
---

<objective>
Create isolated component tests using Vitest and React Testing Library.
</objective>

<process>
1. **Research**: Read 3+ similar files (MANDATORY)
   - Check `__tests__/form.test.tsx` or `__tests__/dialog-manager.test.tsx`
   - Check `test/setup.tsx` for test utilities

2. **Plan**: Define test scenarios and mocks needed

3. **Create test**: Write in `__tests__/<component>.test.tsx`

4. **Run test**: `pnpm test:ci <test-file>`

5. **Iterate**: Fix until test passes, remove debug statements
   </process>

<test_template>

```typescript
import { setup } from "../test/setup";
import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

describe("ComponentName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle user interaction", async () => {
    const mockFn = vi.fn();
    const { user } = setup(<ComponentName onSubmit={mockFn} />);

    await user.click(screen.getByRole("button", { name: /submit/i }));
    expect(mockFn).toHaveBeenCalled();
  });
});
```

</test_template>

<mocking_patterns>

```typescript
// Mock modules
vi.mock("@/lib/module", () => ({
  functionName: vi.fn(),
}));

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// Mock server actions
vi.mock("@/features/module/action", () => ({
  serverAction: vi.fn().mockResolvedValue({ success: true }),
}));
```

</mocking_patterns>

<rules>
- Read 3 files minimum before creating
- Mock external dependencies
- Test behavior, not implementation
- Remove debug statements after test passes
</rules>

<success_criteria>

- Uses setup() helper from test/setup.tsx
- External dependencies mocked
- All assertions pass
  </success_criteria>

---

Create unit test for: $ARGUMENTS
