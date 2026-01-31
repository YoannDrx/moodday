import { buttonVariants } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";
import Link from "next/link";
import { AuthButton } from "../auth/auth-button";
import { HeaderBase } from "./header-base";

export async function Header() {
  const { t } = await getI18n();

  return (
    <HeaderBase>
      <Link
        href="/guides"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        {t("nav.guides")}
      </Link>
      <Link
        href="/about"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        {t("nav.about")}
      </Link>
      <Link
        href="/contact"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        {t("nav.contact")}
      </Link>
      <AuthButton />
    </HeaderBase>
  );
}
