import { Heading, Preview, Text } from "react-email";
import { Signature } from "../components/signature";
import { BilingualSection } from "../utils/bilingual-section";
import { CTAButton } from "../utils/cta-button";
import {
  CONTACT_EMAIL,
  EMAIL_COLORS,
  EMAIL_URLS,
  SiteConfig,
} from "../utils/email-constants";
import { EmailLayout } from "../utils/email-layout";
import { LanguageDivider } from "../utils/language-divider";

type SubscriptionCanceledEmailProps = {
  userName: string;
  planName: string;
  endDate: string;
};

export default function SubscriptionCanceledEmail({
  userName = "Utilisateur",
  planName = "Pro",
  endDate = "15 février 2025",
}: SubscriptionCanceledEmailProps) {
  const pricingUrl = EMAIL_URLS.pricing();

  return (
    <EmailLayout>
      <Preview>
        Votre abonnement {SiteConfig.title} a été annulé / Your{" "}
        {SiteConfig.title} subscription has been canceled
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
          Votre abonnement a été annulé
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
          Nous confirmons l'annulation de votre abonnement{" "}
          <strong>{planName}</strong>. Nous sommes tristes de vous voir partir !
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Vous conservez l'accès aux fonctionnalités {planName} jusqu'au{" "}
          <strong>{endDate}</strong>. Après cette date, votre compte passera
          automatiquement au plan Gratuit.
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Vos données seront préservées et vous pourrez vous réabonner à tout
          moment.
        </Text>

        <CTAButton href={pricingUrl}>Se réabonner</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          Si vous avez des questions ou souhaitez partager votre feedback,
          contactez-nous à {CONTACT_EMAIL}.
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
          Your subscription has been canceled
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
          We confirm the cancellation of your <strong>{planName}</strong>{" "}
          subscription. We're sad to see you go!
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          You retain access to {planName} features until{" "}
          <strong>{endDate}</strong>. After this date, your account will
          automatically switch to the Free plan.
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Your data will be preserved and you can resubscribe at any time.
        </Text>

        <CTAButton href={pricingUrl}>Resubscribe</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          If you have any questions or want to share feedback, contact us at{" "}
          {CONTACT_EMAIL}.
        </Text>

        <Signature lang="en" />
      </BilingualSection>
    </EmailLayout>
  );
}
