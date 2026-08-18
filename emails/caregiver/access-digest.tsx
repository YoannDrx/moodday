import { Heading, Preview, Text } from "react-email";
import { CTAButton } from "../utils/cta-button";
import { EMAIL_COLORS } from "../utils/email-constants";
import { EmailLayout } from "../utils/email-layout";

type CaregiverAccessDigestEmailProps = {
  locale: "fr" | "en";
  accessCount: number;
  caregiverCount: number;
  caregiverUrl: string;
};

export default function CaregiverAccessDigestEmail({
  locale,
  accessCount,
  caregiverCount,
  caregiverUrl,
}: CaregiverAccessDigestEmailProps) {
  const french = locale === "fr";
  const title = french
    ? "Nouveaux accès à votre espace partagé"
    : "New access to your shared space";
  const summary = french
    ? `${accessCount} accès par ${caregiverCount} aidant${caregiverCount > 1 ? "s" : ""} ont été enregistrés depuis votre dernier digest.`
    : `${accessCount} access event${accessCount > 1 ? "s" : ""} by ${caregiverCount} caregiver${caregiverCount > 1 ? "s" : ""} were recorded since your last digest.`;

  return (
    <EmailLayout>
      <Preview>{title}</Preview>
      <Heading
        as="h1"
        style={{
          color: EMAIL_COLORS.textPrimary,
          fontSize: "24px",
          fontWeight: 700,
          margin: "0 0 24px 0",
        }}
      >
        {title}
      </Heading>
      <Text
        style={{
          color: EMAIL_COLORS.textSecondary,
          fontSize: "16px",
          lineHeight: "1.6",
          margin: "0 0 16px 0",
        }}
      >
        {summary}
      </Text>
      <Text
        style={{
          color: EMAIL_COLORS.textMuted,
          fontSize: "14px",
          lineHeight: "1.6",
          margin: "0 0 24px 0",
        }}
      >
        {french
          ? "Cet e-mail ne contient ni nom d’aidant, ni note, ni donnée de santé. Vous pouvez modifier sa fréquence ou le désactiver depuis votre cercle aidant."
          : "This email contains no caregiver name, note, or health data. You can change its frequency or disable it from your caregiver circle."}
      </Text>
      <CTAButton href={caregiverUrl}>
        {french ? "Voir le journal des accès" : "View access log"}
      </CTAButton>
    </EmailLayout>
  );
}
