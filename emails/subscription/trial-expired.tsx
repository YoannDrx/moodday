import { Heading, Preview, Text } from "react-email";
import { FeatureList, FREE_LIMITATIONS } from "../components/feature-list";
import { Signature } from "../components/signature";
import { BilingualSection } from "../utils/bilingual-section";
import { CTAButton } from "../utils/cta-button";
import { EMAIL_COLORS, EMAIL_URLS, SiteConfig } from "../utils/email-constants";
import { EmailLayout } from "../utils/email-layout";
import { LanguageDivider } from "../utils/language-divider";

type TrialExpiredEmailProps = {
  userName: string;
  planName: string;
};

export default function TrialExpiredEmail({
  userName = "Utilisateur",
  planName = "Pro",
}: TrialExpiredEmailProps) {
  const pricingUrl = EMAIL_URLS.pricing();

  return (
    <EmailLayout>
      <Preview>
        Votre essai {SiteConfig.title} a expiré / Your {SiteConfig.title} trial
        has expired
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
          Votre essai est terminé
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
          Votre essai gratuit du plan <strong>{planName}</strong> est maintenant
          terminé. Votre compte a été basculé sur le plan Gratuit.
        </Text>

        <FeatureList
          features={FREE_LIMITATIONS}
          lang="fr"
          title={{
            fr: "Ce qui a changé :",
            en: "What has changed:",
          }}
        />

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Vos données sont préservées et vous pourrez y accéder à nouveau en
          souscrivant à un abonnement.
        </Text>

        <CTAButton href={pricingUrl}>Voir les offres</CTAButton>

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
          Your trial has ended
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
          Your free trial of the <strong>{planName}</strong> plan has now ended.
          Your account has been switched to the Free plan.
        </Text>

        <FeatureList
          features={FREE_LIMITATIONS}
          lang="en"
          title={{
            fr: "Ce qui a changé :",
            en: "What has changed:",
          }}
        />

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Your data is preserved and you can access it again by subscribing to a
          plan.
        </Text>

        <CTAButton href={pricingUrl}>View plans</CTAButton>

        <Signature lang="en" />
      </BilingualSection>
    </EmailLayout>
  );
}
