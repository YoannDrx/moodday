import { Heading, Preview, Text } from "react-email";
import { CTAButton } from "../utils/cta-button";
import { EMAIL_COLORS } from "../utils/email-constants";
import { EmailLayout } from "../utils/email-layout";

type NewSignInEmailProps = {
  locale: "fr" | "en";
  device: string;
  occurredAt: string;
  securityUrl: string;
};

export default function NewSignInEmail({
  locale,
  device,
  occurredAt,
  securityUrl,
}: NewSignInEmailProps) {
  const french = locale === "fr";
  const title = french
    ? "Nouvelle connexion à votre compte Moodday"
    : "New sign-in to your Moodday account";

  return (
    <EmailLayout>
      <Preview>{title}</Preview>
      <Heading
        as="h1"
        style={{
          color: EMAIL_COLORS.textPrimary,
          fontSize: "24px",
          fontWeight: 700,
          margin: "0 0 24px 0",
        }}
      >
        {title}
      </Heading>
      <Text
        style={{
          color: EMAIL_COLORS.textSecondary,
          fontSize: "16px",
          lineHeight: "1.6",
          margin: "0 0 16px 0",
        }}
      >
        {french
          ? `Une nouvelle session a été créée le ${occurredAt} depuis ${device}.`
          : `A new session was created on ${occurredAt} from ${device}.`}
      </Text>
      <Text
        style={{
          color: EMAIL_COLORS.textMuted,
          fontSize: "14px",
          lineHeight: "1.6",
          margin: "0 0 24px 0",
        }}
      >
        {french
          ? "Si vous ne reconnaissez pas cette connexion, révoquez immédiatement les autres sessions et changez votre mot de passe. Cet e-mail n’affiche ni adresse IP complète ni donnée de santé."
          : "If you do not recognize this sign-in, immediately revoke other sessions and change your password. This email displays neither a full IP address nor health data."}
      </Text>
      <CTAButton href={securityUrl}>
        {french ? "Vérifier mes sessions" : "Review my sessions"}
      </CTAButton>
    </EmailLayout>
  );
}
