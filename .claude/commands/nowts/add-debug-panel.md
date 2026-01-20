---
description: Add debug actions or info to the Debug Panel (dev-only)
allowed-tools: Read, Write, Edit, Glob, Grep
---

<objective>
Add custom debug actions or info to the Debug Panel. The Debug Panel is a development-only tool that displays useful information and provides quick action buttons.
</objective>

<overview>
The Debug Panel (`src/features/debug/`) provides:
- **Draggable & Resizable** floating panel (top-left)
- **Collapsed state**: Small circular badge showing Tailwind breakpoint
- **Expanded state**: Panel with info display and action buttons
- **Production-safe**: Returns `null` when `NODE_ENV === "production"`
- **Built-in info**: User email and session ID (when logged in)
</overview>

<api_reference>

## Import

```tsx
import {
  useDebugPanelStore,
  type DebugAction,
  type DebugInfo,
} from "@/features/debug";
```

## Types

```tsx
type DebugAction = {
  id: string; // Unique identifier
  label: string; // Button text
  onClick: () => void | Promise<void>; // Action handler (supports server actions)
  variant?: "default" | "destructive"; // Button style (default = outline, destructive = red)
};

type DebugInfo = {
  id: string; // Unique identifier
  label: string; // Info label
  value: string | number | boolean | null; // Displayed value
};
```

## Store Methods

```tsx
const store = useDebugPanelStore.getState();

// Actions
store.addAction(action: DebugAction);
store.removeAction(id: string);

// Info
store.addInfo(info: DebugInfo);
store.removeInfo(id: string);
store.updateInfo(id: string, value: DebugInfo["value"]);
```

</api_reference>

<patterns>
## Pattern 1: Add Action in a Client Component

```tsx
"use client";

import { useDebugPanelStore } from "@/features/debug";
import { useEffect } from "react";
import { clearCacheAction } from "./actions";

export function MyComponent() {
  useEffect(() => {
    const store = useDebugPanelStore.getState();

    store.addAction({
      id: "clear-cache",
      label: "Clear Cache",
      onClick: () => clearCacheAction(),
    });

    return () => {
      store.removeAction("clear-cache");
    };
  }, []);

  return <div>...</div>;
}
```

## Pattern 2: Add Info with useEffect

```tsx
"use client";

import { useDebugPanelStore } from "@/features/debug";
import { useEffect } from "react";

export function DebugEnvInfo() {
  useEffect(() => {
    const store = useDebugPanelStore.getState();

    store.addInfo({
      id: "env",
      label: "Environment",
      value: process.env.NODE_ENV,
    });

    store.addInfo({
      id: "build-id",
      label: "Build ID",
      value: process.env.NEXT_PUBLIC_BUILD_ID ?? "local",
    });

    return () => {
      store.removeInfo("env");
      store.removeInfo("build-id");
    };
  }, []);

  return null;
}
```

## Pattern 3: Dynamic Info Updates

```tsx
"use client";

import { useDebugPanelStore } from "@/features/debug";
import { useEffect } from "react";

export function DebugCounter({ count }: { count: number }) {
  useEffect(() => {
    useDebugPanelStore.getState().addInfo({
      id: "counter",
      label: "Count",
      value: count,
    });
  }, [count]);

  useEffect(() => {
    return () => {
      useDebugPanelStore.getState().removeInfo("counter");
    };
  }, []);

  return null;
}
```

## Pattern 4: Destructive Action

```tsx
store.addAction({
  id: "reset-db",
  label: "Reset DB",
  variant: "destructive",
  onClick: async () => {
    await resetDatabaseAction();
  },
});
```

## Pattern 5: Multiple Actions at Once

```tsx
useEffect(() => {
  const store = useDebugPanelStore.getState();

  const actions = [
    { id: "seed-users", label: "Seed Users", onClick: seedUsersAction },
    { id: "clear-cache", label: "Clear Cache", onClick: clearCacheAction },
    {
      id: "reset-db",
      label: "Reset DB",
      onClick: resetDbAction,
      variant: "destructive" as const,
    },
  ];

  actions.forEach(store.addAction);

  return () => {
    actions.forEach((a) => store.removeAction(a.id));
  };
}, []);
```

</patterns>

<rules>
- ALWAYS use unique `id` values to avoid conflicts
- ALWAYS clean up with `removeAction`/`removeInfo` in useEffect return
- Actions support async functions (loading state shown automatically)
- Use `variant: "destructive"` for dangerous actions
- The Debug Panel is only visible in development (`NODE_ENV !== "production"`)
- Server actions can be called directly in `onClick` handlers
</rules>

<process>
1. **Identify what to add**: Action (button) or Info (display value)
2. **Create a client component** that registers the action/info in useEffect
3. **Use unique IDs** to prevent conflicts
4. **Clean up on unmount** by removing the action/info
5. **Place the component** in the appropriate layout or page
</process>

<success_criteria>

- Action/Info appears in Debug Panel when component is mounted
- Action/Info is removed when component unmounts
- Loading state works for async actions
- No duplicate IDs with existing debug items
  </success_criteria>
