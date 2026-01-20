import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ContactSupportDialog } from "@/features/contact/support/contact-support-dialog";
import { getI18n } from "@/i18n/server";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { env } from "@/lib/env";
import { getResend } from "@/lib/mail/resend";
import { combineWithParentMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import type { PageParams } from "@/types/next";
import type { ResolvingMetadata } from "next";
import { AccountLayout } from "../account-layout";
import { ToggleEmailCheckbox } from "./toggle-email-checkbox";

export const generateMetadata = async (
  params: PageParams,
  parent: ResolvingMetadata,
) => {
  const { t } = await getI18n();

  return combineWithParentMetadata({
    title: t("account.email.metaTitle"),
    description: t("account.email.metaDescription"),
  })(params, parent);
};

export default async function MailProfilePage() {
  const { t } = await getI18n();
  const user = await getRequiredUser();
  const userWithResendContactId = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      resendContactId: true,
    },
  });

  if (!userWithResendContactId?.resendContactId) {
    return (
      <AccountLayout>
        <div className="flex flex-col gap-4 lg:gap-8">
          <ErrorComponent />
        </div>
      </AccountLayout>
    );
  }

  if (!env.RESEND_AUDIENCE_ID) {
    return (
      <AccountLayout>
        <div className="flex flex-col gap-4 lg:gap-8">
          <ErrorComponent />
        </div>
      </AccountLayout>
    );
  }

  const { data: resendUser } = await getResend().contacts.get({
    audienceId: env.RESEND_AUDIENCE_ID,
    id: userWithResendContactId.resendContactId,
  });

  if (!resendUser) {
    return (
      <AccountLayout>
        <div className="flex flex-col gap-4 lg:gap-8">
          <ErrorComponent />
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout>
      <div className="flex flex-col gap-4 lg:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("account.email.title")}</CardTitle>
            <CardDescription>{t("account.email.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ToggleEmailCheckbox unsubscribed={resendUser.unsubscribed} />
          </CardContent>
        </Card>
      </div>
    </AccountLayout>
  );
}

const ErrorComponent = async () => {
  const { t } = await getI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("account.email.errorTitle")}</CardTitle>
        <CardDescription>{t("account.email.errorDescription")}</CardDescription>
      </CardHeader>
      <CardFooter>
        <ContactSupportDialog />
      </CardFooter>
    </Card>
  );
};
