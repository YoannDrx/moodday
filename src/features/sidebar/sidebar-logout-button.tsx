"use client";

import { Loader } from "@/components/nowts/loader";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { LogOut } from "lucide-react";

type SidebarLogoutButtonProps = {
  className?: string;
};

export function SidebarLogoutButton({ className }: SidebarLogoutButtonProps) {
  const { t } = useI18n();
  const logout = useMutation({
    mutationFn: async () => {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/";
          },
        },
      });
    },
  });

  return (
    <Button
      type="button"
      variant="outline"
      className={cn("w-full justify-start gap-2", className)}
      onClick={() => logout.mutate()}
      data-testid="sidebar-logout"
    >
      {logout.isPending ? (
        <Loader className="size-4" />
      ) : (
        <LogOut className="size-4" />
      )}
      {t("auth.logout")}
    </Button>
  );
}
