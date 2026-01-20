import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getI18n } from "@/i18n/server";
import { Star } from "lucide-react";
import type { PropsWithChildren } from "react";

type ReviewSmallProps = PropsWithChildren<{
  /**
   * An array of URLs to users avatar.
   */
  avatars: string[];
  /**
   * The number of stars to display.
   */
  stars: number;
}>;

export const ReviewSmall = async (props: ReviewSmallProps) => {
  const { t } = await getI18n();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center">
        {props.avatars.map((avatar) => (
          <Avatar
            key={avatar}
            className="border-background -mr-4 size-12 border-4 last:mr-0"
          >
            <AvatarFallback>A</AvatarFallback>
            <AvatarImage
              src={avatar}
              alt={t("landing.reviews.avatarAltGeneric")}
            />
          </Avatar>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => {
            const isFilled = i < props.stars;
            return (
              <Star
                size={20}
                className="text-yellow-400"
                fill={isFilled ? "currentColor" : undefined}
                key={i}
              />
            );
          })}
        </div>
        <div>{props.children}</div>
      </div>
    </div>
  );
};
