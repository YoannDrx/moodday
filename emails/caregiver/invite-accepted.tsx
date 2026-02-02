import { Heading, Preview, Text } from "@react-email/components";
import { Signature } from "../components/signature";
import { BilingualSection } from "../utils/bilingual-section";
import { CTAButton } from "../utils/cta-button";
import { EMAIL_COLORS, EMAIL_URLS, SiteConfig } from "../utils/email-constants";
import { EmailLayout } from "../utils/email-layout";
import { LanguageDivider } from "../utils/language-divider";

type InviteAcceptedEmailProps = {
  patientName: string;
  caregiverName: string;
};

export default function InviteAcceptedEmail({
  patientName = "Patient",
  caregiverName = "Jean Dupont",
}: InviteAcceptedEmailProps) {
  const dashboardUrl = EMAIL_URLS.dashboard();

  return (
    <EmailLayout>
      <Preview>
        {caregiverName} a accepté de devenir votre aidant / {caregiverName} has
        accepted to become your caregiver
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
          Bonne nouvelle ! 🎉
        </Heading>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textPrimary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Bonjour {patientName},
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          <strong>{caregiverName}</strong> a accepté votre invitation et est
          maintenant votre aidant sur {SiteConfig.title}.
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          {caregiverName} pourra désormais :
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
          <li>
            Recevoir des alertes si votre humeur est basse plusieurs jours
          </li>
          <li>Consulter vos rapports de suivi</li>
          <li>Vous accompagner dans votre parcours bien-être</li>
        </ul>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Vous pouvez gérer vos aidants à tout moment dans les paramètres de
          votre compte.
        </Text>

        <CTAButton href={dashboardUrl}>Voir mon tableau de bord</CTAButton>

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
          Great news! 🎉
        </Heading>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textPrimary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Hello {patientName},
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          <strong>{caregiverName}</strong> has accepted your invitation and is
          now your caregiver on {SiteConfig.title}.
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          {caregiverName} will now be able to:
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
          <li>Receive alerts if your mood is low for several days</li>
          <li>View your tracking reports</li>
          <li>Support you on your well-being journey</li>
        </ul>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          You can manage your caregivers at any time in your account settings.
        </Text>

        <CTAButton href={dashboardUrl}>View my dashboard</CTAButton>

        <Signature lang="en" />
      </BilingualSection>
    </EmailLayout>
  );
}
