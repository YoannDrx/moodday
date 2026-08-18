import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Tailwind,
  Text,
} from "react-email";
import type { PropsWithChildren } from "react";
import {
  CONTACT_EMAIL,
  EMAIL_COLORS,
  EMAIL_FONTS,
  EMAIL_URLS,
  SiteConfig,
} from "./email-constants";

type EmailLayoutProps = PropsWithChildren<{
  disableTailwind?: boolean;
}>;

/**
 * EmailLayout is the main layout for all MoodDay emails.
 * It includes the MoodDay branding header and footer.
 *
 * @param props.children The email content
 * @param props.disableTailwind If true, children are rendered without Tailwind CSS
 */
export const EmailLayout = ({
  children,
  disableTailwind,
}: EmailLayoutProps) => {
  const logoUrl = EMAIL_URLS.logo();

  return (
    <Html>
      <Head />
      <Body
        style={{
          backgroundColor: EMAIL_COLORS.background,
          fontFamily: EMAIL_FONTS.primary,
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "40px 20px",
          }}
        >
          {/* Email Card */}
          <div
            style={{
              backgroundColor: EMAIL_COLORS.cardBackground,
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "32px 32px 24px",
                borderBottom: `1px solid ${EMAIL_COLORS.border}`,
              }}
            >
              <table cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
                <tr>
                  <td style={{ paddingRight: "12px", width: "48px" }}>
                    <Img
                      src={logoUrl}
                      width={48}
                      height={48}
                      alt={`${SiteConfig.title} logo`}
                      style={{
                        borderRadius: "10px",
                      }}
                    />
                  </td>
                  <td>
                    <Text
                      style={{
                        fontSize: "24px",
                        fontWeight: 700,
                        color: EMAIL_COLORS.primary,
                        margin: 0,
                        letterSpacing: "-0.5px",
                      }}
                    >
                      {SiteConfig.title}
                    </Text>
                  </td>
                </tr>
              </table>
            </div>

            {/* Content */}
            <div style={{ padding: "32px" }}>
              {disableTailwind ? children : <Tailwind>{children}</Tailwind>}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "24px 32px",
                backgroundColor: EMAIL_COLORS.background,
                borderTop: `1px solid ${EMAIL_COLORS.border}`,
              }}
            >
              <table cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
                <tr>
                  <td style={{ paddingRight: "12px", width: "32px" }}>
                    <Img
                      src={logoUrl}
                      width={32}
                      height={32}
                      alt={`${SiteConfig.title} logo`}
                      style={{
                        borderRadius: "6px",
                      }}
                    />
                  </td>
                  <td>
                    <Text
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: EMAIL_COLORS.textPrimary,
                        margin: 0,
                      }}
                    >
                      {SiteConfig.title}
                    </Text>
                  </td>
                </tr>
              </table>

              <Hr
                style={{
                  borderColor: EMAIL_COLORS.border,
                  margin: "16px 0",
                }}
              />

              <Text
                style={{
                  fontSize: "12px",
                  color: EMAIL_COLORS.textMuted,
                  margin: "0 0 8px 0",
                  lineHeight: "1.5",
                }}
              >
                Cet email a été envoyé par {SiteConfig.title}. Si vous avez des
                questions, contactez-nous à{" "}
                <Link
                  href={`mailto:${CONTACT_EMAIL}`}
                  style={{ color: EMAIL_COLORS.primary }}
                >
                  {CONTACT_EMAIL}
                </Link>
                .
              </Text>

              <Text
                style={{
                  fontSize: "12px",
                  color: EMAIL_COLORS.textMuted,
                  margin: "0 0 8px 0",
                  lineHeight: "1.5",
                }}
              >
                This email was sent by {SiteConfig.title}. If you have any
                questions, contact us at{" "}
                <Link
                  href={`mailto:${CONTACT_EMAIL}`}
                  style={{ color: EMAIL_COLORS.primary }}
                >
                  {CONTACT_EMAIL}
                </Link>
                .
              </Text>

              {SiteConfig.company.address && (
                <Text
                  style={{
                    fontSize: "12px",
                    color: EMAIL_COLORS.textMuted,
                    margin: "12px 0 0 0",
                  }}
                >
                  {SiteConfig.company.name} • {SiteConfig.company.address}
                </Text>
              )}
            </div>
          </div>
        </Container>
      </Body>
    </Html>
  );
};
