"use client";

import { Loader } from "@/components/nowts/loader";
import { Card } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
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
  const { setLastUsedProvider } = useLastUsedProviderStore();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (searchParams.get("provider")) {
      setLastUsedProvider(searchParams.get("provider") as AuthProvider);
    }
  }, [searchParams, setLastUsedProvider]);

  useEffect(() => {
    // Wait for session to be loaded and user to be authenticated before redirecting
    // This ensures the cookie is properly set before navigation
    if (hasRedirected.current) return;
    if (isPending) return;

    // Session is loaded - redirect now with cache-busting parameter
    hasRedirected.current = true;
    const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
    // Add timestamp to bypass any browser/Next.js caching
    const separator = callbackUrl.includes("?") ? "&" : "?";
    window.location.replace(`${callbackUrl}${separator}_t=${Date.now()}`);
  }, [session, isPending, searchParams]);

  return null;
};
