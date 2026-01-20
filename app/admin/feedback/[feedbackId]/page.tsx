import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { InlineTooltip } from "@/components/ui/tooltip";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getI18n } from "@/i18n/server";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { getInitials } from "@/lib/utils/initials";
import { getFeedbackById } from "@/query/feedback/get-feedback";
import { Angry, ChevronRight, Frown, Meh, SmilePlus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FeedbackReplyButton } from "../_components/feedback-reply-button";

export default async function Page(props: {
  params: Promise<{ feedbackId: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <FeedbackDetailPage {...props} />
    </Suspense>
  );
}

async function FeedbackDetailPage(props: {
  params: Promise<{ feedbackId: string }>;
}) {
  const params = await props.params;
  const { locale, t } = await getI18n();
  await getRequiredAdmin();

  const feedback = await getFeedbackById(params.feedbackId);

  if (!feedback) {
    notFound();
  }

  const reviewIcons = [
    {
      value: 1,
      icon: Angry,
      tooltipKey: "admin.feedback.ratings.extremelyDissatisfied",
    },
    {
      value: 2,
      icon: Frown,
      tooltipKey: "admin.feedback.ratings.somewhatDissatisfied",
    },
    {
      value: 3,
      icon: Meh,
      tooltipKey: "admin.feedback.ratings.neutral",
    },
    {
      value: 4,
      icon: SmilePlus,
      tooltipKey: "admin.feedback.ratings.satisfied",
    },
  ];

  const reviewIcon = reviewIcons.find((icon) => icon.value === feedback.review);
  const displayName = feedback.user?.name ?? t("admin.users.anonymous");
  const displayEmail =
    feedback.user?.email ?? feedback.email ?? t("admin.users.noEmail");

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>{t("admin.feedback.detailTitle")}</LayoutTitle>
        <LayoutDescription>
          {t("admin.feedback.submitted")}{" "}
          {new Date(feedback.createdAt).toLocaleDateString(locale)}
        </LayoutDescription>
      </LayoutHeader>

      <LayoutContent className="space-y-6">
        {feedback.user ? (
          <Item variant="outline" asChild>
            <Link
              href={`/admin/users/${feedback.user.id}`}
              className="cursor-pointer"
            >
              <ItemMedia>
                <Avatar className="size-10">
                  <AvatarImage
                    src={feedback.user.image ?? undefined}
                    alt={displayName}
                  />
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  {displayName}
                  <Badge variant="outline" className="text-xs">
                    {t(`admin.users.roles.${feedback.user.role ?? "user"}`)}
                  </Badge>
                </ItemTitle>
                <ItemDescription>{displayEmail}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <ChevronRight className="text-muted-foreground size-5" />
              </ItemActions>
            </Link>
          </Item>
        ) : (
          <Item variant="outline">
            <ItemMedia>
              <Avatar className="size-10">
                <AvatarFallback>{displayEmail[0].toUpperCase()}</AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{t("admin.users.anonymous")}</ItemTitle>
              <ItemDescription>{displayEmail}</ItemDescription>
            </ItemContent>
          </Item>
        )}

        <Item variant="outline">
          <ItemMedia>
            {reviewIcon && (
              <InlineTooltip title={t(reviewIcon.tooltipKey)}>
                <reviewIcon.icon size={24} className="text-primary" />
              </InlineTooltip>
            )}
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              {reviewIcon
                ? t(reviewIcon.tooltipKey)
                : t("admin.feedback.noRating")}
            </ItemTitle>
            <ItemDescription className="whitespace-pre-wrap">
              {feedback.message}
            </ItemDescription>
          </ItemContent>
        </Item>

        <FeedbackReplyButton
          feedbackId={feedback.id}
          recipientName={displayName}
        />
      </LayoutContent>
    </Layout>
  );
}
