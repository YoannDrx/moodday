import { Heading, Preview, Text } from "@react-email/components";
import { FeatureList, PRO_FEATURES } from "../components/feature-list";
import { Signature } from "../components/signature";
import { BilingualSection } from "../utils/bilingual-section";
import { CTAButton } from "../utils/cta-button";
import { EMAIL_COLORS, EMAIL_URLS, SiteConfig } from "../utils/email-constants";
import { EmailLayout } from "../utils/email-layout";
import { LanguageDivider } from "../utils/language-divider";

type TrialWelcomeEmailProps = {
  userName: string;
  planName: string;
  trialEndDate: string;
};

export default function TrialWelcomeEmail({
  userName = "Utilisateur",
  planName = "Pro",
  trialEndDate = "15 février 2025",
}: TrialWelcomeEmailProps) {
  const dashboardUrl = EMAIL_URLS.dashboard();

  return (
    <EmailLayout>
      <Preview>
        Bienvenue dans votre essai {SiteConfig.title} {planName} ! / Welcome to
        your {SiteConfig.title} {planName} trial!
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
          Bienvenue dans {SiteConfig.title} {planName} ! 🎉
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
          Merci d'avoir choisi {SiteConfig.title} ! Vous bénéficiez maintenant
          de <strong>14 jours d'essai gratuit</strong> du plan {planName}.
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Votre essai se termine le <strong>{trialEndDate}</strong>.
        </Text>

        <FeatureList
          features={PRO_FEATURES}
          lang="fr"
          title={{
            fr: "Pendant cette période, vous avez accès à :",
            en: "During this period, you have access to:",
          }}
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
          Welcome to {SiteConfig.title} {planName}! 🎉
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
          Thank you for choosing {SiteConfig.title}! You now have{" "}
          <strong>14 days of free trial</strong> on the {planName} plan.
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Your trial ends on <strong>{trialEndDate}</strong>.
        </Text>

        <FeatureList
          features={PRO_FEATURES}
          lang="en"
          title={{
            fr: "Pendant cette période, vous avez accès à :",
            en: "During this period, you have access to:",
          }}
        />

        <CTAButton href={dashboardUrl}>Get Started</CTAButton>

        <Signature lang="en" />
      </BilingualSection>
    </EmailLayout>
  );
}
