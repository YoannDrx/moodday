import { Heading, Preview, Text } from "@react-email/components";
import { Signature } from "../components/signature";
import { BilingualSection } from "../utils/bilingual-section";
import { CTAButton } from "../utils/cta-button";
import { EMAIL_COLORS, SiteConfig } from "../utils/email-constants";
import { EmailLayout } from "../utils/email-layout";
import { LanguageDivider } from "../utils/language-divider";

type ResetPasswordEmailProps = {
  userName: string;
  resetUrl: string;
};

export default function ResetPasswordEmail({
  userName = "Utilisateur",
  resetUrl = "https://moodday.app/reset-password",
}: ResetPasswordEmailProps) {
  return (
    <EmailLayout>
      <Preview>
        Réinitialisez votre mot de passe {SiteConfig.title} / Reset your{" "}
        {SiteConfig.title} password
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
          Réinitialisez votre mot de passe
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
          Vous avez demandé à réinitialiser votre mot de passe pour votre compte{" "}
          {SiteConfig.title}. Cliquez sur le bouton ci-dessous pour créer un
          nouveau mot de passe.
        </Text>

        <CTAButton href={resetUrl}>Réinitialiser mon mot de passe</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette
          réinitialisation, vous pouvez ignorer cet email en toute sécurité.
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
          Reset your password
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
          You requested to reset your password for your {SiteConfig.title}{" "}
          account. Click the button below to create a new password.
        </Text>

        <CTAButton href={resetUrl}>Reset my password</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          This link expires in 1 hour. If you didn't request this reset, you can
          safely ignore this email.
        </Text>

        <Signature lang="en" />
      </BilingualSection>
    </EmailLayout>
  );
}
