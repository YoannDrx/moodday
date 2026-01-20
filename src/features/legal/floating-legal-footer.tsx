import { SiteConfig } from "@/site-config";
import { getI18n } from "@/i18n/server";
import Image from "next/image";
import Link from "next/link";

export const FloatingLegalFooter = async () => {
  const { t } = await getI18n();

  return (
    <div className="fixed right-2 bottom-2 flex items-center gap-2">
      <Link
        className="text-muted-foreground text-xs hover:underline"
        href="/legal/privacy"
      >
        {t("footer.privacy")}
      </Link>
      <Link
        className="text-muted-foreground text-xs hover:underline"
        href="/legal/terms"
      >
        {t("footer.terms")}
      </Link>
      <Image
        src={SiteConfig.appIcon}
        width={12}
        height={12}
        alt={t("nav.logoAlt")}
      />
    </div>
  );
};
