import { Typography } from "@/components/nowts/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getI18n } from "@/i18n/server";

type UserDetailsCardProps = {
  user: {
    name: string | null;
    email: string | null;
    image?: string | null;
    role?: string | null;
    emailVerified?: boolean | null;
    banned?: boolean | null;
    createdAt: Date | string;
  };
};

export async function UserDetailsCard({ user }: UserDetailsCardProps) {
  const { locale, t } = await getI18n();

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0">
        <Avatar className="mr-2 size-10">
          <AvatarImage src={user.image ?? undefined} />
          <AvatarFallback>{user.name?.charAt(0) ?? "?"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <CardTitle>{user.name ?? t("admin.userDetails.noName")}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Badge variant="outline">
          {t(`admin.users.roles.${user.role ?? "user"}`)}
        </Badge>
        {!user.emailVerified && (
          <>
            <Typography variant="muted" className="text-sm">
              {" • "}
            </Typography>
            <Badge variant="outline">{t("admin.users.unverified")}</Badge>
          </>
        )}
        {user.banned && (
          <>
            <Typography variant="muted" className="text-sm">
              {" • "}
            </Typography>
            <Badge variant="destructive">
              {t("admin.users.status.banned")}
            </Badge>
          </>
        )}
        <Typography variant="muted" className="text-sm">
          {" • "}
        </Typography>
        <Typography variant="muted" className="text-sm">
          {t("admin.userDetails.created")}{" "}
          {new Date(user.createdAt).toLocaleDateString(locale)}
        </Typography>
      </CardContent>
    </Card>
  );
}
