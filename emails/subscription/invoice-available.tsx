import { Heading, Preview, Text } from "react-email";
import { Signature } from "../components/signature";
import { BilingualSection } from "../utils/bilingual-section";
import { CTAButton } from "../utils/cta-button";
import { EMAIL_COLORS, EMAIL_URLS, SiteConfig } from "../utils/email-constants";
import { EmailLayout } from "../utils/email-layout";
import { LanguageDivider } from "../utils/language-divider";

type InvoiceAvailableEmailProps = {
  userName: string;
  invoiceNumber: string;
  amount: string;
  invoiceDate: string;
};

export default function InvoiceAvailableEmail({
  userName = "Utilisateur",
  invoiceNumber = "INV-2025-001",
  amount = "9,99 €",
  invoiceDate = "15 février 2025",
}: InvoiceAvailableEmailProps) {
  const billingUrl = EMAIL_URLS.billing();

  return (
    <EmailLayout>
      <Preview>
        Votre facture {SiteConfig.title} est disponible / Your{" "}
        {SiteConfig.title} invoice is available
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
          📄 Nouvelle facture disponible
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
          Votre facture {SiteConfig.title} est maintenant disponible.
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
            <strong>Numéro de facture :</strong> {invoiceNumber}
          </Text>
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
              margin: "0",
            }}
          >
            <strong>Date :</strong> {invoiceDate}
          </Text>
        </div>

        <CTAButton href={billingUrl}>Consulter mes factures</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          Vous pouvez également accéder à toutes vos factures dans la section{" "}
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
          📄 New invoice available
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
          Your {SiteConfig.title} invoice is now available.
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
            <strong>Invoice number:</strong> {invoiceNumber}
          </Text>
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
              margin: "0",
            }}
          >
            <strong>Date:</strong> {invoiceDate}
          </Text>
        </div>

        <CTAButton href={billingUrl}>View my invoices</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          You can also access all your invoices in the{" "}
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
