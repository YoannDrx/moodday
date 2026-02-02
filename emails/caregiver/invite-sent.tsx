import { Heading, Preview, Text } from "@react-email/components";
import { Signature } from "../components/signature";
import { BilingualSection } from "../utils/bilingual-section";
import { CTAButton } from "../utils/cta-button";
import { EMAIL_COLORS, SiteConfig } from "../utils/email-constants";
import { EmailLayout } from "../utils/email-layout";
import { LanguageDivider } from "../utils/language-divider";

type InviteSentEmailProps = {
  caregiverName: string;
  patientName: string;
  inviteUrl: string;
};

export default function InviteSentEmail({
  caregiverName = "Aidant",
  patientName = "Patient",
  inviteUrl = "https://moodday.app/invite/abc123",
}: InviteSentEmailProps) {
  return (
    <EmailLayout>
      <Preview>
        {patientName} vous invite à suivre son bien-être / {patientName} invites
        you to follow their well-being
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
          Vous êtes invité(e) à devenir aidant 🤝
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
          <strong>{patientName}</strong> vous invite à suivre son bien-être sur{" "}
          {SiteConfig.title}. En tant qu'aidant, vous pourrez :
        </Text>

        <ul
          style={{
            margin: "0 0 16px 0",
            padding: "0 0 0 20px",
            color: EMAIL_COLORS.textSecondary,
            fontSize: "15px",
            lineHeight: "1.6",
          }}
        >
          <li>Recevoir des alertes si l'humeur de {patientName} est basse</li>
          <li>Consulter les rapports de suivi</li>
          <li>Rester informé(e) de son évolution</li>
        </ul>

        <CTAButton href={inviteUrl}>Accepter l'invitation</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          Cette invitation expire dans 7 jours. Si vous ne souhaitez pas devenir
          aidant, vous pouvez simplement ignorer cet email.
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
          You're invited to become a caregiver 🤝
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
          <strong>{patientName}</strong> invites you to follow their well-being
          on {SiteConfig.title}. As a caregiver, you will be able to:
        </Text>

        <ul
          style={{
            margin: "0 0 16px 0",
            padding: "0 0 0 20px",
            color: EMAIL_COLORS.textSecondary,
            fontSize: "15px",
            lineHeight: "1.6",
          }}
        >
          <li>Receive alerts if {patientName}'s mood is low</li>
          <li>View tracking reports</li>
          <li>Stay informed about their progress</li>
        </ul>

        <CTAButton href={inviteUrl}>Accept invitation</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          This invitation expires in 7 days. If you don't want to become a
          caregiver, you can simply ignore this email.
        </Text>

        <Signature lang="en" />
      </BilingualSection>
    </EmailLayout>
  );
}
