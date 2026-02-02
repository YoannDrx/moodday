import { Heading, Preview, Text } from "@react-email/components";
import { Signature } from "../components/signature";
import { BilingualSection } from "../utils/bilingual-section";
import { CTAButton } from "../utils/cta-button";
import { EMAIL_COLORS, EMAIL_URLS, SiteConfig } from "../utils/email-constants";
import { EmailLayout } from "../utils/email-layout";
import { LanguageDivider } from "../utils/language-divider";

type InactivityReminderEmailProps = {
  userName: string;
  daysSinceLastEntry: number;
  lastEntryDate?: string;
};

export default function InactivityReminderEmail({
  userName = "Utilisateur",
  daysSinceLastEntry = 3,
  lastEntryDate = "lundi dernier",
}: InactivityReminderEmailProps) {
  const dashboardUrl = EMAIL_URLS.dashboard();

  return (
    <EmailLayout>
      <Preview>
        Vous nous manquez sur {SiteConfig.title} ! / We miss you on{" "}
        {SiteConfig.title}!
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
          Vous nous manquez ! 💙
        </Heading>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textPrimary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Bonjour {userName},
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Nous avons remarqué que vous n'avez pas enregistré votre humeur depuis{" "}
          <strong>{daysSinceLastEntry} jours</strong>
          {lastEntryDate && ` (dernière entrée : ${lastEntryDate})`}.
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Prendre quelques secondes chaque jour pour noter votre humeur vous
          aide à :
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
          <li>Mieux comprendre vos patterns émotionnels</li>
          <li>Identifier ce qui influence votre bien-être</li>
          <li>Avoir un historique précieux pour vos consultations</li>
        </ul>

        <CTAButton href={dashboardUrl}>Enregistrer mon humeur</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          Vous pouvez désactiver ces rappels dans les paramètres de votre
          compte.
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
          We miss you! 💙
        </Heading>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textPrimary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Hello {userName},
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          We noticed you haven't logged your mood for{" "}
          <strong>{daysSinceLastEntry} days</strong>
          {lastEntryDate && ` (last entry: ${lastEntryDate})`}.
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Taking a few seconds each day to log your mood helps you:
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
          <li>Better understand your emotional patterns</li>
          <li>Identify what influences your well-being</li>
          <li>Have valuable history for your consultations</li>
        </ul>

        <CTAButton href={dashboardUrl}>Log my mood</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          You can disable these reminders in your account settings.
        </Text>

        <Signature lang="en" />
      </BilingualSection>
    </EmailLayout>
  );
}
