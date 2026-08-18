import { Text } from "react-email";
import { EMAIL_COLORS } from "../utils/email-constants";

type FeatureItem = {
  fr: string;
  en: string;
};

type FeatureListProps = {
  features: FeatureItem[];
  lang: "fr" | "en";
  title?: {
    fr: string;
    en: string;
  };
};

export const FeatureList = ({ features, lang, title }: FeatureListProps) => {
  return (
    <div style={{ margin: "16px 0" }}>
      {title && (
        <Text
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: EMAIL_COLORS.textPrimary,
            margin: "0 0 12px 0",
          }}
        >
          {title[lang]}
        </Text>
      )}
      <ul
        style={{
          margin: "0",
          padding: "0 0 0 20px",
          listStyleType: "disc",
        }}
      >
        {features.map((feature, index) => (
          <li
            key={index}
            style={{
              fontSize: "15px",
              color: EMAIL_COLORS.textSecondary,
              marginBottom: "8px",
              lineHeight: "1.5",
            }}
          >
            {feature[lang]}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Predefined feature lists for reuse
export const PRO_FEATURES: FeatureItem[] = [
  { fr: "Médicaments illimités", en: "Unlimited medications" },
  { fr: "Historique complet", en: "Full history" },
  { fr: "Partage avec vos aidants", en: "Share with caregivers" },
  { fr: "Export PDF personnalisé", en: "Custom PDF export" },
  { fr: "Insights IA avancés", en: "Advanced AI insights" },
];

export const FREE_LIMITATIONS: FeatureItem[] = [
  { fr: "Médicaments : limité à 2", en: "Medications: limited to 2" },
  { fr: "Historique : limité à 7 jours", en: "History: limited to 7 days" },
  { fr: "Partage avec aidants : désactivé", en: "Caregiver sharing: disabled" },
  {
    fr: "Export PDF personnalisé : désactivé",
    en: "Custom PDF export: disabled",
  },
  { fr: "Insights IA : désactivé", en: "AI insights: disabled" },
];

export const LOST_FEATURES: FeatureItem[] = [
  {
    fr: "Médicaments illimités → Limité à 2",
    en: "Unlimited medications → Limited to 2",
  },
  {
    fr: "Historique complet → Limité à 7 jours",
    en: "Full history → Limited to 7 days",
  },
  { fr: "Partage avec aidants", en: "Caregiver sharing" },
  { fr: "Export PDF personnalisé", en: "Custom PDF export" },
  { fr: "Insights IA avancés", en: "Advanced AI insights" },
];
