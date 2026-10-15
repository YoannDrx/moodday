import { getMessages } from "@/i18n/messages";
import { I18nProvider } from "@/i18n/provider";
import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { SignUpCredentialsForm } from "../app/auth/signup/sign-up-credentials-form";
import { setup } from "../test/setup";

vi.unmock("@/i18n/provider");

it.each(["fr", "en"] as const)(
  "names the legal documents using the real %s dictionary",
  (locale) => {
    const messages = getMessages(locale);
    setup(
      <I18nProvider locale={locale} messages={messages}>
        <SignUpCredentialsForm
          termsVersion="terms-test"
          privacyVersion="privacy-test"
          healthDataConsentVersion="health-data-test"
          launchCountry="FR"
        />
      </I18nProvider>,
    );
    expect(
      screen.getByRole("link", { name: messages.footer.terms }),
    ).toHaveAttribute("href", "/legal/terms");
    expect(
      screen.getByRole("link", { name: messages.footer.privacy }),
    ).toHaveAttribute("href", "/legal/privacy");
    expect(screen.queryByText("nav.terms")).not.toBeInTheDocument();
    expect(screen.queryByText("nav.privacy")).not.toBeInTheDocument();
  },
);
