import { Heading, Preview, Text } from "@react-email/components";
import { FeatureList } from "../components/feature-list";
import { Signature } from "../components/signature";
import { BilingualSection } from "../utils/bilingual-section";
import { CTAButton } from "../utils/cta-button";
import { EMAIL_COLORS, EMAIL_URLS, SiteConfig } from "../utils/email-constants";
import { EmailLayout } from "../utils/email-layout";
import { LanguageDivider } from "../utils/language-divider";

type WelcomeEmailProps = {
  userName: string;
};

export default function WelcomeEmail({
  userName = "Utilisateur",
}: WelcomeEmailProps) {
  const dashboardUrl = EMAIL_URLS.dashboard();

  return (
    <EmailLayout>
      <Preview>
        Bienvenue sur {SiteConfig.title} ! / Welcome to {SiteConfig.title}!
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
          Bienvenue sur {SiteConfig.title} ! 🎉
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
          Merci de nous avoir rejoints ! Nous sommes ravis de vous accompagner
          dans le suivi de votre bien-être quotidien.
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Avec {SiteConfig.title}, vous pouvez :
        </Text>

        <FeatureList
          features={[
            { fr: "Suivre votre humeur au quotidien", en: "" },
            { fr: "Gérer vos médicaments et rappels", en: "" },
            { fr: "Visualiser votre historique et vos tendances", en: "" },
            { fr: "Partager des rapports avec vos soignants", en: "" },
          ]}
          lang="fr"
        />

        <CTAButton href={dashboardUrl}>Commencer maintenant</CTAButton>

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
          Welcome to {SiteConfig.title}! 🎉
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
          Thank you for joining us! We're excited to help you track your daily
          well-being.
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          With {SiteConfig.title}, you can:
        </Text>

        <FeatureList
          features={[
            { fr: "", en: "Track your mood daily" },
            { fr: "", en: "Manage your medications and reminders" },
            { fr: "", en: "View your history and trends" },
            { fr: "", en: "Share reports with your caregivers" },
          ]}
          lang="en"
        />

        <CTAButton href={dashboardUrl}>Get Started</CTAButton>

        <Signature lang="en" />
      </BilingualSection>
    </EmailLayout>
  );
}
