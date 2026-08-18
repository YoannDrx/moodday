import type { NavigationGroup } from "@/features/navigation/navigation.type";
import { Activity } from "lucide-react";

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
          Icon: Activity,
          label: "Exploitation",
        },
      ],
    },
  ];
};
