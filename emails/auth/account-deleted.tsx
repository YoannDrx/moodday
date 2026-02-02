import { Heading, Preview, Text } from "@react-email/components";
import { Signature } from "../components/signature";
import { BilingualSection } from "../utils/bilingual-section";
import { CTAButton } from "../utils/cta-button";
import {
  CONTACT_EMAIL,
  EMAIL_COLORS,
  SiteConfig,
} from "../utils/email-constants";
import { EmailLayout } from "../utils/email-layout";
import { LanguageDivider } from "../utils/language-divider";

type AccountDeletedEmailProps = {
  userName: string;
  confirmUrl: string;
};

export default function AccountDeletedEmail({
  userName = "Utilisateur",
  confirmUrl = "https://moodday.app/auth/confirm-delete",
}: AccountDeletedEmailProps) {
  return (
    <EmailLayout>
      <Preview>
        Confirmez la suppression de votre compte {SiteConfig.title} / Confirm
        your {SiteConfig.title} account deletion
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
          Confirmez la suppression de votre compte
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
          Vous avez demandé à supprimer votre compte {SiteConfig.title}. Cette
          action est <strong>définitive</strong> et entraînera la suppression de
          toutes vos données.
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          <strong>Ce qui sera supprimé :</strong>
        </Text>

        <ul
          style={{
            margin: "0 0 16px 0",
            padding: "0 0 0 20px",
            color: EMAIL_COLORS.textSecondary,
            fontSize: "15px",
            lineHeight: "1.6",
          }}
        >
          <li>Votre profil et vos paramètres</li>
          <li>Tout votre historique d'humeur</li>
          <li>Vos médicaments et rappels</li>
          <li>Vos connexions avec vos aidants</li>
        </ul>

        <CTAButton href={confirmUrl}>Confirmer la suppression</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          Ce lien expire dans 24 heures. Si vous n'avez pas demandé cette
          suppression ou souhaitez conserver votre compte, vous pouvez ignorer
          cet email. Pour toute question, contactez-nous à {CONTACT_EMAIL}.
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
          Confirm your account deletion
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
          You requested to delete your {SiteConfig.title} account. This action
          is <strong>permanent</strong> and will result in the deletion of all
          your data.
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          <strong>What will be deleted:</strong>
        </Text>

        <ul
          style={{
            margin: "0 0 16px 0",
            padding: "0 0 0 20px",
            color: EMAIL_COLORS.textSecondary,
            fontSize: "15px",
            lineHeight: "1.6",
          }}
        >
          <li>Your profile and settings</li>
          <li>All your mood history</li>
          <li>Your medications and reminders</li>
          <li>Your connections with caregivers</li>
        </ul>

        <CTAButton href={confirmUrl}>Confirm deletion</CTAButton>

        <Text
          style={{
            fontSize: "14px",
            color: EMAIL_COLORS.textMuted,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          This link expires in 24 hours. If you didn't request this deletion or
          want to keep your account, you can ignore this email. For any
          questions, contact us at {CONTACT_EMAIL}.
        </Text>

        <Signature lang="en" />
      </BilingualSection>
    </EmailLayout>
  );
}
