import { BaseLayout } from "@/features/layout/base-layout";
import { Error401 } from "@/features/page/error-401";
import { Layout } from "@/features/page/layout";

export default function RoutePage() {
  return (
    <BaseLayout>
      <Layout>
        <Error401 />
      </Layout>
    </BaseLayout>
  );
}
