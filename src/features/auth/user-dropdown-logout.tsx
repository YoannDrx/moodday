"use client";

import { Loader } from "@/components/nowts/loader";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useI18n } from "@/i18n/provider";
import { signOut } from "@/lib/auth-client";
import { useMutation } from "@tanstack/react-query";
import { LogOut } from "lucide-react";

export const UserDropdownLogout = () => {
  const { t } = useI18n();
  const logout = useMutation({
    mutationFn: async () => {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            // Callback fires after the server-side cookie is cleared.
            window.location.href = "/";
          },
        },
      });
    },
  });

  return (
    <DropdownMenuItem
      data-testid="dropdown-logout"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        logout.mutate();
      }}
    >
      {logout.isPending ? (
        <Loader className="mr-2 size-4" />
      ) : (
        <LogOut className="mr-2 size-4" />
      )}
      <span>{t("auth.logout")}</span>
    </DropdownMenuItem>
  );
};
