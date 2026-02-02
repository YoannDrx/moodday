import type { PropsWithChildren } from "react";
import { Section } from "@react-email/components";

type BilingualSectionProps = PropsWithChildren<{
  lang: "fr" | "en";
}>;

export const BilingualSection = ({ lang, children }: BilingualSectionProps) => {
  return (
    <Section
      dir="ltr"
      style={{
        marginBottom: "8px",
      }}
      data-lang={lang}
    >
      {children}
    </Section>
  );
};
