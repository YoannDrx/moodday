import { SiteConfig } from "@/site-config";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account/",
          "/admin/",
          "/api/",
          "/caregiver/",
          "/dashboard/",
          "/medications/",
          "/mood/",
          "/settings/",
          "/therapy/",
          "/trends/",
        ],
      },
    ],
    sitemap: `${SiteConfig.prodUrl}/sitemap.xml`,
    host: SiteConfig.prodUrl,
  };
}
