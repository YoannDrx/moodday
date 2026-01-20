import { Activity, Heart, MessageCircle, User2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getI18n } from "@/i18n/server";

export default async function InformationCards() {
  const { t } = await getI18n();

  return (
    <div className="flex w-full items-start gap-4 max-lg:flex-col lg:gap-8">
      <Card className="w-full flex-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("app.cards.totalLikes")}
          </CardTitle>
          <Heart className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">12'032</div>
          <p className="text-muted-foreground text-xs">
            {t("app.cards.totalLikesDelta")}
          </p>
        </CardContent>
      </Card>
      <Card className="w-full flex-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("app.cards.totalThreads")}
          </CardTitle>
          <MessageCircle className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">124</div>
          <p className="text-muted-foreground text-xs">
            {t("app.cards.totalThreadsDelta")}
          </p>
        </CardContent>
      </Card>
      <Card className="w-full flex-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("app.cards.newSubscribers")}
          </CardTitle>
          <User2 className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+1288</div>
          <p className="text-muted-foreground text-xs">
            {t("app.cards.newSubscribersDelta")}
          </p>
        </CardContent>
      </Card>
      <Card className="w-full flex-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("app.cards.impressions")}
          </CardTitle>
          <Activity className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">120'011</div>
          <p className="text-muted-foreground text-xs">
            {t("app.cards.impressionsDelta")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
