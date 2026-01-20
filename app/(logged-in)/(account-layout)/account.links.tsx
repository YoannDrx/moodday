import type { NavigationGroup } from "@/features/navigation/navigation.type";
import { AlertCircle, LayoutDashboard, Mail, User2 } from "lucide-react";

type Translator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export const getAccountNavigation = (t: Translator): NavigationGroup[] => {
  return [
    {
      title: t("account.profile.section"),
      links: [
        {
          href: "/account",
          Icon: User2,
          label: t("account.profile.profile"),
        },
        {
          href: "/account/email",
          Icon: Mail,
          label: t("account.profile.mail"),
        },
        {
          href: "/account/danger",
          Icon: AlertCircle,
          label: t("account.profile.danger"),
        },
      ],
    },
    {
      title: t("nav.app"),
      links: [
        {
          href: "/app",
          Icon: LayoutDashboard,
          label: t("nav.dashboard"),
        },
      ],
    },
  ];
};
