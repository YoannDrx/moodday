"use client";

import { HeaderBaseClient } from "@/features/layout/header-base-client";
import { Page400Client } from "@/features/page/page-400-client";

export default function ErrorPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <HeaderBaseClient />
      <div className="flex flex-1 items-center justify-center">
        <Page400Client />
      </div>
    </div>
  );
}
