import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getI18n } from "@/i18n/server";

export default async function NotFoundPage() {
  const { t } = await getI18n();

  return (
    <Layout>
      <LayoutHeader>
        <LayoutTitle>{t("posts.notFound.title")}</LayoutTitle>
      </LayoutHeader>
      <LayoutContent>
        <Card>
          <CardHeader>
            <CardTitle>{t("posts.notFound.description")}</CardTitle>
          </CardHeader>
        </Card>
      </LayoutContent>
    </Layout>
  );
}
