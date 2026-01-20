"use client";

import { SiteConfig } from "@/site-config";
import Image from "next/image";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { Layout } from "../page/layout";

/**
 * Simplified header for error boundaries.
 * Does not use i18n context since it may not be available during errors.
 */
export function HeaderBaseClient({ children }: PropsWithChildren) {
  return (
    <header className="bg-card sticky top-0 z-50 flex h-14 items-center gap-4 border-b px-4 lg:h-[60px] lg:px-6">
      <Layout className="my-2">
        <div className="flex items-center gap-2">
          <Image src={SiteConfig.appIcon} alt="Logo" width={32} height={32} />
          <Link href="/" className="text-base font-bold">
            {SiteConfig.title}
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">{children}</nav>
        </div>
      </Layout>
    </header>
  );
}
