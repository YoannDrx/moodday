import { SiteConfig } from "@/site-config";
import { defaultLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { createTranslator } from "@/i18n/translator";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const t = createTranslator(getMessages(defaultLocale));

  return {
    name: SiteConfig.title,
    short_name: SiteConfig.title,
    description: t("meta.description"),
    start_url: "/",
    display: "standalone",
    background_color: "#F7F5F0",
    theme_color: SiteConfig.brand.primary,
    icons: [
      {
        src: "/icons/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
