import { Text } from "react-email";
import { EMAIL_COLORS, SiteConfig } from "../utils/email-constants";

type SignatureProps = {
  lang: "fr" | "en";
};

export const Signature = ({ lang }: SignatureProps) => {
  const closings = {
    fr: "À très bientôt,",
    en: "See you soon,",
  };

  const teamName = {
    fr: `L'équipe ${SiteConfig.title}`,
    en: `The ${SiteConfig.title} Team`,
  };

  return (
    <div style={{ marginTop: "24px" }}>
      <Text
        style={{
          fontSize: "14px",
          color: EMAIL_COLORS.textSecondary,
          margin: "0",
          lineHeight: "1.6",
        }}
      >
        {closings[lang]}
        <br />
        {teamName[lang]}
      </Text>
    </div>
  );
};
