import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getI18n } from "@/i18n/server";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import type { PageProps } from "@/types/next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { UserDetailsCard } from "../../_components/user-details-card";
import { UserActions } from "./_components/user-actions";
import { UserProviders } from "./_components/user-providers";
import { UserSessions } from "./_components/user-sessions";

export default async function Page(props: PageProps<"/admin/users/[userId]">) {
  return (
    <Suspense fallback={null}>
      <RoutePage {...props} />
    </Suspense>
  );
}

async function RoutePage(props: PageProps<"/admin/users/[userId]">) {
  const params = await props.params;
  const { t } = await getI18n();
  await getRequiredAdmin();

  const userData = await prisma.user.findUnique({
    where: {
      id: params.userId,
    },
    include: {
      subscription: true,
      accounts: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!userData) {
    notFound();
  }

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>{t("admin.userDetails.title")}</LayoutTitle>
        <LayoutDescription>
          {t("admin.userDetails.description")}
        </LayoutDescription>
      </LayoutHeader>
      <LayoutActions>
        <UserActions user={userData} />
      </LayoutActions>

      <LayoutContent className="flex flex-col gap-4">
        <UserDetailsCard user={userData} />

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.userDetails.subscriptionTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!userData.subscription ? (
              <div className="text-muted-foreground py-4 text-center">
                {t("admin.userDetails.noSubscription")}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Avatar className="size-10">
                  <AvatarImage src={userData.image ?? undefined} />
                  <AvatarFallback className="text-sm">
                    {userData.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {t(`plans.names.${userData.subscription.plan}`)}
                    </span>
                    <Badge
                      variant={
                        userData.subscription.status === "active"
                          ? "default"
                          : userData.subscription.status === "canceled"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {t(
                        `admin.userDetails.subscriptionStatus.${userData.subscription.status}`,
                      )}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <UserSessions userId={userData.id} />
        <UserProviders accounts={userData.accounts} />
      </LayoutContent>
    </Layout>
  );
}
