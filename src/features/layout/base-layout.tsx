import { SiteFooter } from "@/features/site/site-footer";
import { SiteHeader } from "@/features/site/site-header";
import type { PropsWithChildren } from "react";

export function BaseLayout(props: PropsWithChildren) {
  return (
    <div className="bg-background relative flex min-h-full flex-col">
      <SiteHeader />
      <main id="contenu" className="flex-1">
        {props.children}
      </main>
      <SiteFooter />
    </div>
  );
}
