import { Heading, Preview, Text } from "@react-email/components";
import { Signature } from "../components/signature";
import { BilingualSection } from "../utils/bilingual-section";
import { CTAButton } from "../utils/cta-button";
import { EMAIL_COLORS, EMAIL_URLS, SiteConfig } from "../utils/email-constants";
import { EmailLayout } from "../utils/email-layout";
import { LanguageDivider } from "../utils/language-divider";

type AdherenceCongratsEmailProps = {
  userName: string;
  streakDays: number;
};

export default function AdherenceCongratsEmail({
  userName = "Utilisateur",
  streakDays = 7,
}: AdherenceCongratsEmailProps) {
  const dashboardUrl = EMAIL_URLS.dashboard();

  // Get milestone message
  const getMilestoneMessage = (days: number) => {
    if (days >= 30)
      return {
        fr: "Un mois complet !",
        en: "A full month!",
        emoji: "🏆",
      };
    if (days >= 14)
      return {
        fr: "Deux semaines d'affilée !",
        en: "Two weeks in a row!",
        emoji: "🌟",
      };
    return {
      fr: "Une semaine complète !",
      en: "A full week!",
      emoji: "🎉",
    };
  };

  const milestone = getMilestoneMessage(streakDays);

  return (
    <EmailLayout>
      <Preview>
        {milestone.emoji} Félicitations ! {String(streakDays)} jours consécutifs
        / {milestone.emoji} Congratulations! {String(streakDays)} consecutive
        days
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
          {milestone.emoji} Félicitations {userName} !
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

        <div
          style={{
            backgroundColor: "#ECFDF5",
            borderRadius: "12px",
            padding: "24px",
            margin: "16px 0",
            textAlign: "center",
          }}
        >
          <Text
            style={{
              fontSize: "48px",
              margin: "0",
            }}
          >
            🔥
          </Text>
          <Text
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: EMAIL_COLORS.success,
              margin: "8px 0",
            }}
          >
            {streakDays} jours
          </Text>
          <Text
            style={{
              fontSize: "16px",
              color: EMAIL_COLORS.textSecondary,
              margin: "0",
            }}
          >
            {milestone.fr}
          </Text>
        </div>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Vous avez enregistré votre humeur pendant {streakDays} jours
          consécutifs sur {SiteConfig.title}. C'est un excellent travail de
          suivi personnel !
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Continuez comme ça, chaque jour compte pour mieux vous comprendre.
        </Text>

        <CTAButton href={dashboardUrl}>Voir mes statistiques</CTAButton>

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
          {milestone.emoji} Congratulations {userName}!
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

        <div
          style={{
            backgroundColor: "#ECFDF5",
            borderRadius: "12px",
            padding: "24px",
            margin: "16px 0",
            textAlign: "center",
          }}
        >
          <Text
            style={{
              fontSize: "48px",
              margin: "0",
            }}
          >
            🔥
          </Text>
          <Text
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: EMAIL_COLORS.success,
              margin: "8px 0",
            }}
          >
            {streakDays} days
          </Text>
          <Text
            style={{
              fontSize: "16px",
              color: EMAIL_COLORS.textSecondary,
              margin: "0",
            }}
          >
            {milestone.en}
          </Text>
        </div>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          You've logged your mood for {streakDays} consecutive days on{" "}
          {SiteConfig.title}. That's excellent personal tracking!
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: EMAIL_COLORS.textSecondary,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Keep it up, every day counts to better understand yourself.
        </Text>

        <CTAButton href={dashboardUrl}>View my stats</CTAButton>

        <Signature lang="en" />
      </BilingualSection>
    </EmailLayout>
  );
}
