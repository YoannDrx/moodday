import { Button } from "react-email";
import { EMAIL_COLORS } from "./email-constants";

type CTAButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
};

export const CTAButton = ({
  href,
  children,
  variant = "primary",
}: CTAButtonProps) => {
  const getStyles = () => {
    switch (variant) {
      case "secondary":
        return {
          backgroundColor: EMAIL_COLORS.textSecondary,
          color: "#FFFFFF",
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          color: EMAIL_COLORS.primary,
          border: `2px solid ${EMAIL_COLORS.primary}`,
        };
      default:
        return {
          backgroundColor: EMAIL_COLORS.primary,
          color: "#FFFFFF",
        };
    }
  };

  const styles = getStyles();

  return (
    <Button
      href={href}
      style={{
        display: "inline-block",
        padding: "14px 28px",
        borderRadius: "8px",
        fontWeight: 600,
        fontSize: "16px",
        textDecoration: "none",
        textAlign: "center",
        marginTop: "16px",
        marginBottom: "16px",
        ...styles,
      }}
    >
      {children}
    </Button>
  );
};
