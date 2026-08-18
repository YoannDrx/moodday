import { Heading, Preview, Text } from "react-email";
import { FeatureList, LOST_FEATURES } from "../components/feature-list";
import { Signature } from "../components/signature";
import { BilingualSection } from "../utils/bilingual-section";
import { CTAButton } from "../utils/cta-button";
import { EMAIL_COLORS, EMAIL_URLS } from "../utils/email-constants";
import { EmailLayout } from "../utils/email-layout";
import { LanguageDivider } from "../utils/language-divider";

type TrialReminderEmailProps = {
  userName: string;
  planName: string;
  daysLeft: number;
  trialEndDate: string;
};

export default function TrialReminderEmail({
  userName = "Utilisateur",
  planName = "Pro",
  daysLeft = 3,
  trialEndDate = "15 février 2025",
}: TrialReminderEmailProps) {
  const billingUrl = EMAIL_URLS.billing();
  const isLastDay = daysLeft === 1;

  const titleFr = isLastDay
    ? "Dernier jour de votre essai !"
    : `Plus que ${daysLeft} jours d'essai`;

  const titleEn = isLastDay
    ? "Last day of your trial!"
    : `Only ${daysLeft} days left in your trial`;

  return (
    <EmailLayout>
      <Preview>
        {titleFr} / {titleEn}
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
          {isLastDay ? "⏰ " : ""}
          {titleFr}
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
          {isLastDay ? (
            <>
              Votre essai gratuit du plan <strong>{planName}</strong> se termine{" "}
              <strong>demain</strong> ({trialEndDate}).
            </>
          ) : (
            <>
              Votre essai gratuit du plan <strong>{planName}</strong> se termine
              dans <strong>{daysLeft} jours</strong> ({trialEndDate}).
            </>
          )}
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Pour continuer à profiter de toutes les fonctionnalités avancées,
          pensez à ajouter un moyen de paiement.
        </Text>

        <FeatureList
          features={LOST_FEATURES}
          lang="fr"
          title={{
            fr: "Ce que vous perdrez sans abonnement :",
            en: "What you'll lose without a subscription:",
          }}
        />

        <CTAButton href={billingUrl}>Gérer mon abonnement</CTAButton>

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
          {isLastDay ? "⏰ " : ""}
          {titleEn}
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
          {isLastDay ? (
            <>
              Your free trial of the <strong>{planName}</strong> plan ends{" "}
              <strong>tomorrow</strong> ({trialEndDate}).
            </>
          ) : (
            <>
              Your free trial of the <strong>{planName}</strong> plan ends in{" "}
              <strong>{daysLeft} days</strong> ({trialEndDate}).
            </>
          )}
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          To continue enjoying all the advanced features, please add a payment
          method.
        </Text>

        <FeatureList
          features={LOST_FEATURES}
          lang="en"
          title={{
            fr: "Ce que vous perdrez sans abonnement :",
            en: "What you'll lose without a subscription:",
          }}
        />

        <CTAButton href={billingUrl}>Manage my subscription</CTAButton>

        <Signature lang="en" />
      </BilingualSection>
    </EmailLayout>
  );
}
