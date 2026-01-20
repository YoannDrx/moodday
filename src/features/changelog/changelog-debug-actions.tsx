"use client";

import { useDebugPanelStore } from "@/features/debug";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { resetDismissedChangelogsAction } from "./changelog.action";

export function ChangelogDebugActions() {
  const router = useRouter();

  useEffect(() => {
    const store = useDebugPanelStore.getState();

    store.addAction({
      id: "reset-changelog",
      label: "Reset Changelog",
      onClick: async () => {
        await resetDismissedChangelogsAction();
        router.refresh();
      },
    });

    return () => {
      store.removeAction("reset-changelog");
    };
  }, [router]);

  return null;
}
