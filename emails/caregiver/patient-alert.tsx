import { Heading, Preview, Text } from "@react-email/components";
import { Signature } from "../components/signature";
import { BilingualSection } from "../utils/bilingual-section";
import { CTAButton } from "../utils/cta-button";
import {
  CONTACT_EMAIL,
  EMAIL_COLORS,
  SiteConfig,
} from "../utils/email-constants";
import { EmailLayout } from "../utils/email-layout";
import { LanguageDivider } from "../utils/language-divider";

type PatientAlertEmailProps = {
  caregiverName: string;
  patientName: string;
  consecutiveDays: number;
  dashboardUrl: string;
};

export default function PatientAlertEmail({
  caregiverName = "Aidant",
  patientName = "Patient",
  consecutiveDays = 3,
  dashboardUrl = "https://moodday.app/caregiver/patient123",
}: PatientAlertEmailProps) {
  return (
    <EmailLayout>
      <Preview>
        ⚠️ Alerte : {patientName} a une humeur basse depuis{" "}
        {String(consecutiveDays)} jours / Alert: {patientName} has had low mood
        for {String(consecutiveDays)} days
      </Preview>

      {/* 🇫🇷 Section Française */}
      <BilingualSection lang="fr">
        <Heading
          as="h1"
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: EMAIL_COLORS.error,
            margin: "0 0 24px 0",
          }}
        >
          ⚠️ Alerte humeur basse
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
          Nous souhaitons vous informer que <strong>{patientName}</strong> a
          enregistré une humeur basse pendant{" "}
          <strong>{consecutiveDays} jours consécutifs</strong> sur{" "}
          {SiteConfig.title}.
        </Text>

        <div
          style={{
            backgroundColor: "#FEF2F2",
            borderLeft: `4px solid ${EMAIL_COLORS.error}`,
            borderRadius: "4px",
            padding: "16px",
            margin: "16px 0",
          }}
        >
          <Text
            style={{
              fontSize: "15px",
              color: EMAIL_COLORS.textPrimary,
              margin: "0",
              fontWeight: 600,
            }}
          >
            Cette alerte est générée automatiquement pour vous permettre de
            prendre contact avec {patientName} si vous le jugez nécessaire.
          </Text>
        </div>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Nous vous encourageons à prendre des nouvelles de {patientName} si
          vous en avez la possibilité.
        </Text>

        <CTAButton href={dashboardUrl}>
          Voir le profil de {patientName}
        </CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          Si vous avez des questions concernant cette alerte, contactez-nous à{" "}
          {CONTACT_EMAIL}.
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
            color: EMAIL_COLORS.error,
            margin: "0 0 24px 0",
          }}
        >
          ⚠️ Low mood alert
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
          We want to inform you that <strong>{patientName}</strong> has recorded
          a low mood for <strong>{consecutiveDays} consecutive days</strong> on{" "}
          {SiteConfig.title}.
        </Text>

        <div
          style={{
            backgroundColor: "#FEF2F2",
            borderLeft: `4px solid ${EMAIL_COLORS.error}`,
            borderRadius: "4px",
            padding: "16px",
            margin: "16px 0",
          }}
        >
          <Text
            style={{
              fontSize: "15px",
              color: EMAIL_COLORS.textPrimary,
              margin: "0",
              fontWeight: 600,
            }}
          >
            This alert is automatically generated to allow you to reach out to{" "}
            {patientName} if you feel it's necessary.
          </Text>
        </div>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          We encourage you to check in on {patientName} if you have the
          opportunity.
        </Text>

        <CTAButton href={dashboardUrl}>View {patientName}'s profile</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          If you have any questions about this alert, contact us at{" "}
          {CONTACT_EMAIL}.
        </Text>

        <Signature lang="en" />
      </BilingualSection>
    </EmailLayout>
  );
}
