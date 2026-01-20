import { Loader } from "@/components/nowts/loader";
import { AccountLayout } from "./account-layout";

export default async function RouteLoading() {
  return (
    <AccountLayout>
      <Loader size={32} />
    </AccountLayout>
  );
}
