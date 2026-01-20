import type { NavigationGroup } from "@/features/navigation/navigation.type";
import { Home, MessageSquare, Users } from "lucide-react";

const ADMIN_PATH = `/admin`;

type Translator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export const getAdminNavigation = (t: Translator): NavigationGroup[] => {
  return [
    {
      title: t("admin.nav.section"),
      links: [
        {
          href: ADMIN_PATH,
          Icon: Home,
          label: t("nav.dashboard"),
        },
        {
          href: `${ADMIN_PATH}/users`,
          Icon: Users,
          label: t("admin.users.title"),
        },
        {
          href: `${ADMIN_PATH}/feedback`,
          Icon: MessageSquare,
          label: t("admin.feedback.title"),
        },
      ],
    },
  ];
};
