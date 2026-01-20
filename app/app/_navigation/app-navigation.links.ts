import type { NavigationGroup } from "@/features/navigation/navigation.type";
import { Home, User } from "lucide-react";

const APP_PATH = "/app";

type Translator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export const getAppNavigation = (t: Translator): NavigationGroup[] => {
  return [
    {
      title: t("nav.menu"),
      links: [
        {
          href: APP_PATH,
          Icon: Home,
          label: t("nav.dashboard"),
        },
        {
          href: `${APP_PATH}/users`,
          Icon: User,
          label: t("nav.analytics"),
        },
      ],
    },
  ];
};
