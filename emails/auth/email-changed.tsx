import { Heading, Preview, Text } from "@react-email/components";
import { Signature } from "../components/signature";
import { BilingualSection } from "../utils/bilingual-section";
import { CTAButton } from "../utils/cta-button";
import { EMAIL_COLORS, SiteConfig } from "../utils/email-constants";
import { EmailLayout } from "../utils/email-layout";
import { LanguageDivider } from "../utils/language-divider";

type EmailChangedProps = {
  userName: string;
  verificationUrl: string;
};

export default function EmailChangedEmail({
  userName = "Utilisateur",
  verificationUrl = "https://moodday.app/verify-email-change",
}: EmailChangedProps) {
  return (
    <EmailLayout>
      <Preview>
        Confirmez votre nouvelle adresse email / Confirm your new email address
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
          Confirmez votre nouvelle adresse email
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
          Vous avez demandé à changer l'adresse email associée à votre compte{" "}
          {SiteConfig.title}. Pour finaliser ce changement, veuillez confirmer
          votre nouvelle adresse en cliquant sur le bouton ci-dessous.
        </Text>

        <CTAButton href={verificationUrl}>
          Confirmer ma nouvelle adresse
        </CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          Ce lien expire dans 24 heures. Si vous n'avez pas demandé ce
          changement, veuillez ignorer cet email et votre adresse actuelle
          restera inchangée.
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
          Confirm your new email address
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
          You requested to change the email address associated with your{" "}
          {SiteConfig.title} account. To complete this change, please confirm
          your new address by clicking the button below.
        </Text>

        <CTAButton href={verificationUrl}>Confirm my new address</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          This link expires in 24 hours. If you didn't request this change,
          please ignore this email and your current address will remain
          unchanged.
        </Text>

        <Signature lang="en" />
      </BilingualSection>
    </EmailLayout>
  );
}
