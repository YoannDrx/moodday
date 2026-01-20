---
description: Build React components using Test-Driven Development with Vitest unit tests for components without database integration
allowed-tools: Read, Write, Edit, Glob, Bash(pnpm test:ci *)
---

<objective>
Build React components using TDD with Vitest unit tests. Write tests FIRST, then implement.
</objective>

<process>
1. **Research**: Read 3+ similar files (MANDATORY)
   - Check `__tests__/form.test.tsx` or `__tests__/dialog-manager.test.tsx`
   - Check `test/setup.tsx` for test utilities

2. **Plan**: Define component structure and props

3. **Create test**: Write unit test FIRST in `__tests__/<component>.test.tsx`

4. **Create component**: Implement in `src/features/` or `src/components/`

5. **Run test**: `pnpm test:ci <test-file>`

6. **Iterate**: Fix until test passes
   </process>

<test_template>

```typescript
import { setup } from "../test/setup";
import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("ComponentName", () => {
  it("should do something", async () => {
    const { user } = setup(<ComponentName />);
    const button = screen.getByRole("button", { name: /click me/i });
    await user.click(button);
    expect(screen.getByText("Result")).toBeInTheDocument();
  });
});
```

</test_template>

<utilities>
- `setup(jsx)` - Wraps with QueryClientProvider, returns `{ user, ...render() }`
- `screen` - Query elements
- `user` - Interact with elements
- `waitFor()` - Wait for async changes
- `vi` - Mock functions and modules
</utilities>

<rules>
- Write test FIRST - no exceptions
- Read 3 files minimum before creating
- Unit tests for components WITHOUT database
- Mock external dependencies with `vi.mock()`
</rules>

<success_criteria>

- Test written before component
- Component follows existing patterns
- Test passes
  </success_criteria>

---

Create unit test for: $ARGUMENTS
