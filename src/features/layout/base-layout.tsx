import { FooterDark } from "@/features/landing/footer-dark";
import { NavbarDark } from "@/features/landing/navbar-dark";
import type { PropsWithChildren } from "react";

export function BaseLayout(props: PropsWithChildren) {
  return (
    <div className="bg-background relative flex min-h-full flex-col">
      <NavbarDark />
      <div className="min-h-full flex-1 pt-24">{props.children}</div>
      <FooterDark />
    </div>
  );
}
