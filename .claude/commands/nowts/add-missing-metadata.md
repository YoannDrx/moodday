---
description: Systematically add missing metadata to Next.js pages for improved SEO
allowed-tools: Read, Edit, Write, Glob, Grep
---

<objective>
Identify and add high-quality metadata to Next.js pages that are missing it.
</objective>

<process>
1. **Explore**: Find all `app/**/page.tsx` files and examine existing metadata patterns
2. **Analyze**: Identify pages without metadata exports (skip `"use client"` files)
3. **Enhance**: Add metadata following project patterns
4. **Verify**: Ensure descriptions are contextual, not generic
</process>

<metadata_template>

```typescript
import type { Metadata } from "next";
import { SiteConfig } from "@/site-config";

export const metadata: Metadata = {
  title: `[Page Title] - ${SiteConfig.title}`,
  description: "[Descriptive sentence about page purpose]",
  keywords: ["keyword1", "keyword2"],
  openGraph: {
    title: `[Page Title] - ${SiteConfig.title}`,
    description: "[Same as description]",
    url: `${SiteConfig.prodUrl}/[route-path]`,
    type: "website",
  },
};
```

</metadata_template>

<rules>
- NEVER add metadata to client components (`"use client"`)
- ALWAYS read page content before writing metadata
- SKIP pages where purpose is unclear
</rules>

<success_criteria>

- All server component pages have metadata
- Descriptions accurately reflect page content
- Metadata follows project conventions
  </success_criteria>
