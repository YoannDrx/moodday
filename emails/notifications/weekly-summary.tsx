import { Heading, Preview, Text } from "@react-email/components";
import { Signature } from "../components/signature";
import { BilingualSection } from "../utils/bilingual-section";
import { CTAButton } from "../utils/cta-button";
import { EMAIL_COLORS, EMAIL_URLS, SiteConfig } from "../utils/email-constants";
import { EmailLayout } from "../utils/email-layout";
import { LanguageDivider } from "../utils/language-divider";

type WeeklySummaryEmailProps = {
  userName: string;
  weekStart: string;
  weekEnd: string;
  entriesCount: number;
  averageMood: number;
  bestDay?: string;
  streakDays: number;
};

export default function WeeklySummaryEmail({
  userName = "Utilisateur",
  weekStart = "20 janvier",
  weekEnd = "26 janvier",
  entriesCount = 5,
  averageMood = 3.5,
  bestDay = "mercredi",
  streakDays = 7,
}: WeeklySummaryEmailProps) {
  const dashboardUrl = EMAIL_URLS.dashboard();

  // Mood emoji based on average
  const getMoodEmoji = (mood: number) => {
    if (mood >= 4) return "😊";
    if (mood >= 3) return "🙂";
    if (mood >= 2) return "😐";
    return "😔";
  };

  const moodEmoji = getMoodEmoji(averageMood);

  return (
    <EmailLayout>
      <Preview>
        Votre semaine {SiteConfig.title} du {weekStart} au {weekEnd} / Your{" "}
        {SiteConfig.title} week from {weekStart} to {weekEnd}
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
          📊 Votre résumé hebdomadaire
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
          Voici votre résumé pour la semaine du {weekStart} au {weekEnd}.
        </Text>

        <div
          style={{
            backgroundColor: "#F3F4F6",
            borderRadius: "8px",
            padding: "20px",
            margin: "16px 0",
          }}
        >
          <table cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
            <tr>
              <td style={{ paddingBottom: "12px" }}>
                <Text
                  style={{
                    fontSize: "14px",
                    color: EMAIL_COLORS.textMuted,
                    margin: "0",
                  }}
                >
                  Humeur moyenne
                </Text>
                <Text
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: EMAIL_COLORS.textPrimary,
                    margin: "4px 0 0 0",
                  }}
                >
                  {moodEmoji} {averageMood.toFixed(1)}/5
                </Text>
              </td>
              <td style={{ paddingBottom: "12px", textAlign: "right" }}>
                <Text
                  style={{
                    fontSize: "14px",
                    color: EMAIL_COLORS.textMuted,
                    margin: "0",
                  }}
                >
                  Entrées cette semaine
                </Text>
                <Text
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: EMAIL_COLORS.textPrimary,
                    margin: "4px 0 0 0",
                  }}
                >
                  {entriesCount}/7
                </Text>
              </td>
            </tr>
            {bestDay && (
              <tr>
                <td style={{ paddingTop: "12px" }}>
                  <Text
                    style={{
                      fontSize: "14px",
                      color: EMAIL_COLORS.textMuted,
                      margin: "0",
                    }}
                  >
                    Meilleur jour
                  </Text>
                  <Text
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: EMAIL_COLORS.primary,
                      margin: "4px 0 0 0",
                    }}
                  >
                    {bestDay}
                  </Text>
                </td>
                <td style={{ paddingTop: "12px", textAlign: "right" }}>
                  <Text
                    style={{
                      fontSize: "14px",
                      color: EMAIL_COLORS.textMuted,
                      margin: "0",
                    }}
                  >
                    Série en cours
                  </Text>
                  <Text
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: EMAIL_COLORS.success,
                      margin: "4px 0 0 0",
                    }}
                  >
                    🔥 {streakDays} jours
                  </Text>
                </td>
              </tr>
            )}
          </table>
        </div>

        <CTAButton href={dashboardUrl}>Voir mon historique complet</CTAButton>

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
          📊 Your weekly summary
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
          Here's your summary for the week of {weekStart} to {weekEnd}.
        </Text>

        <div
          style={{
            backgroundColor: "#F3F4F6",
            borderRadius: "8px",
            padding: "20px",
            margin: "16px 0",
          }}
        >
          <table cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
            <tr>
              <td style={{ paddingBottom: "12px" }}>
                <Text
                  style={{
                    fontSize: "14px",
                    color: EMAIL_COLORS.textMuted,
                    margin: "0",
                  }}
                >
                  Average mood
                </Text>
                <Text
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: EMAIL_COLORS.textPrimary,
                    margin: "4px 0 0 0",
                  }}
                >
                  {moodEmoji} {averageMood.toFixed(1)}/5
                </Text>
              </td>
              <td style={{ paddingBottom: "12px", textAlign: "right" }}>
                <Text
                  style={{
                    fontSize: "14px",
                    color: EMAIL_COLORS.textMuted,
                    margin: "0",
                  }}
                >
                  Entries this week
                </Text>
                <Text
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: EMAIL_COLORS.textPrimary,
                    margin: "4px 0 0 0",
                  }}
                >
                  {entriesCount}/7
                </Text>
              </td>
            </tr>
            {bestDay && (
              <tr>
                <td style={{ paddingTop: "12px" }}>
                  <Text
                    style={{
                      fontSize: "14px",
                      color: EMAIL_COLORS.textMuted,
                      margin: "0",
                    }}
                  >
                    Best day
                  </Text>
                  <Text
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: EMAIL_COLORS.primary,
                      margin: "4px 0 0 0",
                    }}
                  >
                    {bestDay}
                  </Text>
                </td>
                <td style={{ paddingTop: "12px", textAlign: "right" }}>
                  <Text
                    style={{
                      fontSize: "14px",
                      color: EMAIL_COLORS.textMuted,
                      margin: "0",
                    }}
                  >
                    Current streak
                  </Text>
                  <Text
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: EMAIL_COLORS.success,
                      margin: "4px 0 0 0",
                    }}
                  >
                    🔥 {streakDays} days
                  </Text>
                </td>
              </tr>
            )}
          </table>
        </div>

        <CTAButton href={dashboardUrl}>View my full history</CTAButton>

        <Signature lang="en" />
      </BilingualSection>
    </EmailLayout>
  );
}
