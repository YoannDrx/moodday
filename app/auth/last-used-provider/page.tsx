"use client";

import { Loader } from "@/components/nowts/loader";
import { Card } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import type { AuthProvider } from "../signin/last-used-provider.store";
import { useLastUsedProviderStore } from "../signin/last-used-provider.store";

export default function LastUsedProviderPage() {
  return (
    <div>
      <Card>
        <Loader />
      </Card>
      <Suspense>
        <LastUsedProvider />
      </Suspense>
    </div>
  );
}

const LastUsedProvider = () => {
  const { lastUsedProvider, setLastUsedProvider } = useLastUsedProviderStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("provider")) {
      setLastUsedProvider(searchParams.get("provider") as AuthProvider);
    }
    // Use hard navigation to ensure server components re-execute with fresh session data
    const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
    window.location.href = callbackUrl;
  }, [searchParams, setLastUsedProvider]);

  return <div>{lastUsedProvider}</div>;
};
