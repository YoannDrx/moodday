import { Heading, Preview, Text } from "@react-email/components";
import { Signature } from "../components/signature";
import { BilingualSection } from "../utils/bilingual-section";
import { CTAButton } from "../utils/cta-button";
import { EMAIL_COLORS, SiteConfig } from "../utils/email-constants";
import { EmailLayout } from "../utils/email-layout";
import { LanguageDivider } from "../utils/language-divider";

type InviteReminderEmailProps = {
  caregiverName: string;
  patientName: string;
  inviteUrl: string;
  daysLeft: number;
};

export default function InviteReminderEmail({
  caregiverName = "Aidant",
  patientName = "Patient",
  inviteUrl = "https://moodday.app/invite/abc123",
  daysLeft = 3,
}: InviteReminderEmailProps) {
  return (
    <EmailLayout>
      <Preview>
        Rappel : {patientName} attend votre réponse / Reminder: {patientName} is
        waiting for your response
      </Preview>

      {/* 🇫🇷 Section Française */}
      <BilingualSection lang="fr">
        <Heading
          as="h1"
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: EMAIL_COLORS.textPrimary,
            margin: "0 0 24px 0",
          }}
        >
          ⏰ Invitation en attente
        </Heading>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textPrimary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Bonjour {caregiverName},
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          <strong>{patientName}</strong> vous a invité(e) à devenir son aidant
          sur {SiteConfig.title}. Votre invitation expire dans{" "}
          <strong>{daysLeft} jours</strong>.
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          En acceptant, vous pourrez suivre le bien-être de {patientName} et
          recevoir des alertes si nécessaire.
        </Text>

        <CTAButton href={inviteUrl}>Accepter l'invitation</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          Si vous ne souhaitez pas devenir aidant, vous pouvez ignorer cet
          email.
        </Text>

        <Signature lang="fr" />
      </BilingualSection>

      <LanguageDivider />

      {/* 🇬🇧 English Section */}
      <BilingualSection lang="en">
        <Heading
          as="h1"
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: EMAIL_COLORS.textPrimary,
            margin: "0 0 24px 0",
          }}
        >
          ⏰ Pending invitation
        </Heading>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textPrimary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Hello {caregiverName},
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          <strong>{patientName}</strong> has invited you to become their
          caregiver on {SiteConfig.title}. Your invitation expires in{" "}
          <strong>{daysLeft} days</strong>.
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          By accepting, you'll be able to follow {patientName}'s well-being and
          receive alerts if needed.
        </Text>

        <CTAButton href={inviteUrl}>Accept invitation</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          If you don't want to become a caregiver, you can ignore this email.
        </Text>

        <Signature lang="en" />
      </BilingualSection>
    </EmailLayout>
  );
}
