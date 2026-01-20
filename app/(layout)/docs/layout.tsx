import type { ReactNode } from "react";
import { DocSidebar } from "./_components/doc-sidebar";
import { getDocs } from "./doc-manager";
import { getI18n } from "@/i18n/server";

export default async function DocsLayout(props: { children: ReactNode }) {
  const { locale } = await getI18n();
  const docs = await getDocs(undefined, locale);

  return (
    <div className="flex flex-1">
      <DocSidebar docs={docs} />
      <main className="flex-1">{props.children}</main>
    </div>
  );
}
