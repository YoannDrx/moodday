"use client";

import { Button } from "@/components/ui/button";
import { Loader } from "@/components/nowts/loader";
import { useProtectedSignOut } from "@/features/auth/use-protected-sign-out";
import { useEffect, useState } from "react";

export function AccountSignOutButton({ label }: { label: string }) {
  const logout = useProtectedSignOut();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => setIsHydrated(true), []);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={!isHydrated || !logout.canSignOut || logout.isPending}
        onClick={() => void logout.requestSignOut()}
      >
        {logout.isPending ? <Loader className="mr-2 size-4" /> : null}
        {label}
      </Button>
      {logout.dialog}
    </>
  );
}
