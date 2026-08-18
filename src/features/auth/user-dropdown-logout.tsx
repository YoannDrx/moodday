"use client";

import { Loader } from "@/components/nowts/loader";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useI18n } from "@/i18n/provider";
import { LogOut } from "lucide-react";

export const UserDropdownLogout = ({
  disabled,
  isPending,
  onLogout,
}: {
  disabled: boolean;
  isPending: boolean;
  onLogout: () => void;
}) => {
  const { t } = useI18n();

  return (
    <DropdownMenuItem
      data-testid="dropdown-logout"
      disabled={disabled || isPending}
      onClick={onLogout}
    >
      {isPending ? (
        <Loader className="mr-2 size-4" />
      ) : (
        <LogOut className="mr-2 size-4" />
      )}
      <span>{t("auth.logout")}</span>
    </DropdownMenuItem>
  );
};
