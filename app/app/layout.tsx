import type { LayoutParams } from "@/types/next";
import { AppNavigation } from "./_navigation/app-navigation";

export default async function AppLayout(props: LayoutParams) {
  return <AppNavigation>{props.children}</AppNavigation>;
}
