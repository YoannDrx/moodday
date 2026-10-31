import { Heading, Preview, Text } from "react-email";
import type { ReactNode } from "react";
import { CTAButton } from "../utils/cta-button";
import { EMAIL_COLORS } from "../utils/email-constants";
import { EmailLayout } from "../utils/email-layout";

// Shared frame of the onboarding sequence. Rule: never any health data in an
// email (no state, symptom, need or cycle date), only product guidance.

export type CoupleEmailProps = {
  preview: string;
  title: string;
  greeting?: string;
  children: ReactNode;
  cta?: { label: string; href: string };
  unsubscribeUrl?: string;
};

export const Paragraph = ({ children }: { children: ReactNode }) => (
  <Text
    style={{
      fontSize: "16px",
      color: EMAIL_COLORS.textPrimary,
      margin: "0 0 16px 0",
      lineHeight: "1.6",
    }}
  >
    {children}
  </Text>
);

export const Bullets = ({ items }: { items: ReactNode[] }) => (
  <table
    cellPadding={0}
    cellSpacing={0}
    style={{ width: "100%", margin: "0 0 16px 0" }}
  >
    <tbody>
      {items.map((item, index) => (
        <tr key={index}>
          <td
            style={{ width: "28px", verticalAlign: "top", paddingTop: "2px" }}
          >
            <span
              style={{
                display: "inline-block",
                width: "20px",
                height: "20px",
                lineHeight: "20px",
                textAlign: "center",
                borderRadius: "999px",
                border: `2px solid ${EMAIL_COLORS.border}`,
                backgroundColor: EMAIL_COLORS.accent,
                fontSize: "12px",
                fontWeight: 700,
                color: EMAIL_COLORS.primary,
              }}
            >
              {index + 1}
            </span>
          </td>
          <td>
            <Text
              style={{
                fontSize: "15px",
                color: EMAIL_COLORS.textPrimary,
                margin: "0 0 10px 0",
                lineHeight: "1.5",
              }}
            >
              {item}
            </Text>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export const Aside = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      backgroundColor: EMAIL_COLORS.mintSoft,
      border: `2px dashed ${EMAIL_COLORS.border}`,
      borderRadius: "16px",
      padding: "12px 16px",
      margin: "0 0 16px 0",
    }}
  >
    <Text
      style={{
        fontSize: "14px",
        color: EMAIL_COLORS.textPrimary,
        margin: 0,
        lineHeight: "1.5",
      }}
    >
      {children}
    </Text>
  </div>
);

export function CoupleEmail({
  preview,
  title,
  greeting,
  children,
  cta,
  unsubscribeUrl,
}: CoupleEmailProps) {
  return (
    <EmailLayout disableTailwind unsubscribeUrl={unsubscribeUrl}>
      <Preview>{preview}</Preview>
      <Heading
        as="h1"
        style={{
          fontSize: "26px",
          fontWeight: 800,
          color: EMAIL_COLORS.textPrimary,
          margin: "0 0 20px 0",
          lineHeight: "1.2",
        }}
      >
        {title}
      </Heading>
      {greeting && <Paragraph>{greeting}</Paragraph>}
      {children}
      {cta && <CTAButton href={cta.href}>{cta.label}</CTAButton>}
      <Text
        style={{
          fontSize: "14px",
          color: EMAIL_COLORS.textSecondary,
          margin: "24px 0 0 0",
          lineHeight: "1.6",
        }}
      >
        Au chaud,
        <br />
        L'équipe Moodday (et Bouyotte, la bouillotte maison)
      </Text>
    </EmailLayout>
  );
}
