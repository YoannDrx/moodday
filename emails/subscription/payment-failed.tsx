import { Heading, Preview, Text } from "@react-email/components";
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

type PaymentFailedEmailProps = {
  userName: string;
  planName: string;
  retryDate?: string;
};

export default function PaymentFailedEmail({
  userName = "Utilisateur",
  planName = "Pro",
  retryDate,
}: PaymentFailedEmailProps) {
  const billingUrl = EMAIL_URLS.billing();

  return (
    <EmailLayout>
      <Preview>
        Échec de paiement {SiteConfig.title} / {SiteConfig.title} payment failed
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
          ⚠️ Échec de paiement
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
          Nous n'avons pas pu traiter le paiement de votre abonnement{" "}
          <strong>{planName}</strong>. Cela peut arriver pour plusieurs raisons
          : carte expirée, fonds insuffisants, ou limite de dépenses atteinte.
        </Text>

        {retryDate && (
          <Text
            style={{
              fontSize: "16px",
              color: EMAIL_COLORS.textSecondary,
              margin: "0 0 16px 0",
              lineHeight: "1.6",
            }}
          >
            Nous réessaierons automatiquement le <strong>{retryDate}</strong>.
          </Text>
        )}

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Pour éviter toute interruption de service, veuillez mettre à jour vos
          informations de paiement dès que possible.
        </Text>

        <CTAButton href={billingUrl}>Mettre à jour mon paiement</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          Si vous avez besoin d'aide, contactez-nous à {CONTACT_EMAIL}.
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
          ⚠️ Payment failed
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
          We were unable to process the payment for your{" "}
          <strong>{planName}</strong> subscription. This can happen for several
          reasons: expired card, insufficient funds, or spending limit reached.
        </Text>

        {retryDate && (
          <Text
            style={{
              fontSize: "16px",
              color: EMAIL_COLORS.textSecondary,
              margin: "0 0 16px 0",
              lineHeight: "1.6",
            }}
          >
            We will automatically retry on <strong>{retryDate}</strong>.
          </Text>
        )}

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          To avoid any service interruption, please update your payment
          information as soon as possible.
        </Text>

        <CTAButton href={billingUrl}>Update my payment</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          If you need help, contact us at {CONTACT_EMAIL}.
        </Text>

        <Signature lang="en" />
      </BilingualSection>
    </EmailLayout>
  );
}
