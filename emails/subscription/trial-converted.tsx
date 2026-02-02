import { Heading, Preview, Text } from "@react-email/components";
import { FeatureList, PRO_FEATURES } from "../components/feature-list";
import { Signature } from "../components/signature";
import { BilingualSection } from "../utils/bilingual-section";
import { CTAButton } from "../utils/cta-button";
import { EMAIL_COLORS, EMAIL_URLS, SiteConfig } from "../utils/email-constants";
import { EmailLayout } from "../utils/email-layout";
import { LanguageDivider } from "../utils/language-divider";

type TrialConvertedEmailProps = {
  userName: string;
  planName: string;
};

export default function TrialConvertedEmail({
  userName = "Utilisateur",
  planName = "Pro",
}: TrialConvertedEmailProps) {
  const dashboardUrl = EMAIL_URLS.dashboard();

  return (
    <EmailLayout>
      <Preview>
        Votre abonnement {SiteConfig.title} {planName} est actif ! / Your{" "}
        {SiteConfig.title} {planName} subscription is active!
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
          Bienvenue parmi nos abonnés {planName} ! 🎉
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
          Excellente nouvelle ! Votre abonnement <strong>{planName}</strong> est
          maintenant actif. Merci de votre confiance !
        </Text>

        <FeatureList
          features={PRO_FEATURES}
          lang="fr"
          title={{
            fr: "Vous continuez à bénéficier de :",
            en: "You continue to enjoy:",
          }}
        />

        <CTAButton href={dashboardUrl}>Accéder à mon tableau de bord</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          Vous pouvez gérer votre abonnement à tout moment depuis les paramètres
          de votre compte.
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
          Welcome to our {planName} subscribers! 🎉
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
          Great news! Your <strong>{planName}</strong> subscription is now
          active. Thank you for your trust!
        </Text>

        <FeatureList
          features={PRO_FEATURES}
          lang="en"
          title={{
            fr: "Vous continuez à bénéficier de :",
            en: "You continue to enjoy:",
          }}
        />

        <CTAButton href={dashboardUrl}>Go to my dashboard</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          You can manage your subscription at any time from your account
          settings.
        </Text>

        <Signature lang="en" />
      </BilingualSection>
    </EmailLayout>
  );
}
