import { Heading, Preview, Text } from "@react-email/components";
import { Signature } from "../components/signature";
import { BilingualSection } from "../utils/bilingual-section";
import { CTAButton } from "../utils/cta-button";
import { EMAIL_COLORS, EMAIL_URLS, SiteConfig } from "../utils/email-constants";
import { EmailLayout } from "../utils/email-layout";
import { LanguageDivider } from "../utils/language-divider";

type RenewalSuccessEmailProps = {
  userName: string;
  planName: string;
  amount: string;
  nextBillingDate: string;
};

export default function RenewalSuccessEmail({
  userName = "Utilisateur",
  planName = "Pro",
  amount = "9,99 €",
  nextBillingDate = "15 mars 2025",
}: RenewalSuccessEmailProps) {
  const dashboardUrl = EMAIL_URLS.dashboard();
  const billingUrl = EMAIL_URLS.billing();

  return (
    <EmailLayout>
      <Preview>
        Renouvellement {SiteConfig.title} confirmé / {SiteConfig.title} renewal
        confirmed
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
          ✅ Paiement reçu
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
          Merci ! Votre abonnement <strong>{planName}</strong> a été renouvelé
          avec succès.
        </Text>

        <div
          style={{
            backgroundColor: "#F3F4F6",
            borderRadius: "8px",
            padding: "16px",
            margin: "16px 0",
          }}
        >
          <Text
            style={{
              fontSize: "14px",
              color: EMAIL_COLORS.textSecondary,
              margin: "0 0 8px 0",
            }}
          >
            <strong>Montant :</strong> {amount}
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: EMAIL_COLORS.textSecondary,
              margin: "0 0 8px 0",
            }}
          >
            <strong>Plan :</strong> {planName}
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: EMAIL_COLORS.textSecondary,
              margin: "0",
            }}
          >
            <strong>Prochain renouvellement :</strong> {nextBillingDate}
          </Text>
        </div>

        <CTAButton href={dashboardUrl}>Accéder à mon tableau de bord</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          Vous pouvez consulter vos factures dans la section{" "}
          <a href={billingUrl} style={{ color: EMAIL_COLORS.primary }}>
            Facturation
          </a>{" "}
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
          ✅ Payment received
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
          Thank you! Your <strong>{planName}</strong> subscription has been
          successfully renewed.
        </Text>

        <div
          style={{
            backgroundColor: "#F3F4F6",
            borderRadius: "8px",
            padding: "16px",
            margin: "16px 0",
          }}
        >
          <Text
            style={{
              fontSize: "14px",
              color: EMAIL_COLORS.textSecondary,
              margin: "0 0 8px 0",
            }}
          >
            <strong>Amount:</strong> {amount}
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: EMAIL_COLORS.textSecondary,
              margin: "0 0 8px 0",
            }}
          >
            <strong>Plan:</strong> {planName}
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: EMAIL_COLORS.textSecondary,
              margin: "0",
            }}
          >
            <strong>Next renewal:</strong> {nextBillingDate}
          </Text>
        </div>

        <CTAButton href={dashboardUrl}>Go to my dashboard</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          You can view your invoices in the{" "}
          <a href={billingUrl} style={{ color: EMAIL_COLORS.primary }}>
            Billing
          </a>{" "}
          section of your account.
        </Text>

        <Signature lang="en" />
      </BilingualSection>
    </EmailLayout>
  );
}
