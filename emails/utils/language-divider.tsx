import { Hr, Text } from "@react-email/components";
import { EMAIL_COLORS } from "./email-constants";

export const LanguageDivider = () => {
  return (
    <div style={{ margin: "32px 0" }}>
      <Hr
        style={{
          borderColor: EMAIL_COLORS.divider,
          borderWidth: "1px",
          margin: "0",
        }}
      />
      <Text
        style={{
          color: EMAIL_COLORS.textMuted,
          fontSize: "12px",
          textAlign: "center",
          margin: "12px 0",
          fontStyle: "italic",
        }}
      >
        — English version below —
      </Text>
      <Hr
        style={{
          borderColor: EMAIL_COLORS.divider,
          borderWidth: "1px",
          margin: "0",
        }}
      />
    </div>
  );
};
