"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const { t } = useI18n();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Sun className="h-6 w-[1.3rem] dark:hidden" />
      <Moon className="hidden size-5 dark:block" />
      <span className="sr-only">{t("actions.toggleTheme")}</span>
    </Button>
  );
}
