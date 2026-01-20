"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { InlineTooltip } from "@/components/ui/tooltip";
import { useI18n } from "@/i18n/provider";
import { getInitials } from "@/lib/utils/initials";
import type { FeedbackWithUser } from "@/query/feedback/get-feedback";
import { Angry, Eye, Frown, Meh, SmilePlus } from "lucide-react";
import Link from "next/link";

type FeedbackItemProps = {
  feedback: FeedbackWithUser;
};

export const FeedbackItem = ({ feedback }: FeedbackItemProps) => {
  const { locale, t } = useI18n();
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

  const truncatedMessage =
    feedback.message.length > 150
      ? `${feedback.message.slice(0, 150)}...`
      : feedback.message;

  const displayName = feedback.user?.name ?? t("admin.users.anonymous");
  const displayEmail =
    feedback.user?.email ?? feedback.email ?? t("admin.users.noEmail");

  return (
    <Item variant="outline" className="items-start">
      <ItemMedia>
        <Avatar className="size-10">
          <AvatarImage
            src={feedback.user?.image ?? undefined}
            alt={displayName}
          />
          <AvatarFallback>
            {feedback.user?.name
              ? getInitials(feedback.user.name)
              : displayEmail[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          {displayName}
          {reviewIcon && (
            <InlineTooltip title={t(reviewIcon.tooltipKey)}>
              <reviewIcon.icon size={16} className="text-primary" />
            </InlineTooltip>
          )}
          <span className="text-muted-foreground text-xs font-normal">
            {new Date(feedback.createdAt).toLocaleDateString(locale)}
          </span>
        </ItemTitle>
        <ItemDescription>
          <Link
            href={`/admin/feedback/${feedback.id}`}
            className="hover:text-foreground transition-colors"
          >
            {truncatedMessage}
          </Link>
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <InlineTooltip title={t("admin.feedback.viewDetails")}>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/feedback/${feedback.id}`}>
              <Eye className="size-4" />
            </Link>
          </Button>
        </InlineTooltip>
      </ItemActions>
    </Item>
  );
};
