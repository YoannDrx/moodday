import { authClient } from "@/lib/auth-client";
import "@testing-library/jest-dom/vitest";
import { screen, waitFor } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignUpCredentialsForm } from "../app/auth/signup/sign-up-credentials-form";
import { setup } from "../test/setup";

describe("SignUpCredentialsForm", () => {
  const renderForm = () =>
    setup(
      <SignUpCredentialsForm
        termsVersion="terms-test"
        privacyVersion="privacy-test"
        healthDataConsentVersion="health-data-test"
        launchCountry="FR"
      />,
    );

  async function acceptRequiredConsents(
    user: ReturnType<typeof setup>["user"],
  ) {
    const consentCheckboxes = screen.getAllByRole("checkbox");
    expect(consentCheckboxes).toHaveLength(4);
    const [ageConsent, termsConsent, privacyConsent, healthDataConsent] =
      consentCheckboxes;
    await user.click(ageConsent);
    await user.click(termsConsent);
    await user.click(privacyConsent);
    await user.click(healthDataConsent);
  }

  beforeEach(() => {
    // Mock window.location
    Object.defineProperty(window, "location", {
      value: {
        origin: "http://localhost:3000",
        href: "http://localhost:3000/auth/signup",
      },
      writable: true,
    });

    // Mock successful signup response
    vi.mocked(authClient.signUp.email).mockResolvedValue({
      data: { success: true },
      error: null,
    });

    // Reset searchParams to default (empty)
    vi.mocked(useSearchParams).mockReturnValue(createTestSearchParams());
  });

  it("should render all form fields", async () => {
    renderForm();

    // Check all fields are rendered
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/verify password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i }),
    ).toBeInTheDocument();
  });

  it("should show error when passwords don't match", async () => {
    const { user } = renderForm();

    // Fill the form with mismatched passwords
    await user.type(screen.getByLabelText(/name/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/verify password/i), "password456");

    // Submit the form
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Password does not match/i)).toBeInTheDocument();
    });

    // Should not call signup API
    expect(authClient.signUp.email).not.toHaveBeenCalled();
  });

  it("should submit form and redirect on successful signup", async () => {
    const { user } = renderForm();

    // Fill all fields correctly
    await user.type(screen.getByLabelText(/name/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/verify password/i), "password123");
    await acceptRequiredConsents(user);

    // Submit the form
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    // Verify API was called with correct data
    await waitFor(() => {
      expect(authClient.signUp.email).toHaveBeenCalledWith({
        email: "john@example.com",
        password: "password123",
        name: "John Doe",
        image: "",
        callbackURL: "/dashboard",
        age18Accepted: true,
        termsVersionAccepted: "terms-test",
        privacyVersionAccepted: "privacy-test",
        healthDataConsentVersionAccepted: "health-data-test",
        signupLocale: "en",
        launchCountry: "FR",
      });
    });

    expect(useRouter().replace).toHaveBeenCalledWith("/auth/verify");
    expect(useRouter().refresh).toHaveBeenCalled();
  });

  it("should use custom callback URL from searchParams", async () => {
    // Mock window.location.search with custom callback
    Object.defineProperty(window, "location", {
      value: {
        origin: "http://localhost:3000",
        href: "http://localhost:3000/auth/signup?callbackUrl=/dashboard",
        search: "?callbackUrl=/dashboard",
      },
      writable: true,
    });

    const { user } = renderForm();

    // Fill all fields correctly
    await user.type(screen.getByLabelText(/name/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/verify password/i), "password123");
    await acceptRequiredConsents(user);

    // Submit the form
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    // Wait for submission to complete
    await waitFor(() => {
      expect(authClient.signUp.email).toHaveBeenCalled();
    });

    expect(authClient.signUp.email).toHaveBeenCalledWith(
      expect.objectContaining({ callbackURL: "/dashboard" }),
    );
    expect(useRouter().replace).toHaveBeenCalledWith("/auth/verify");
    expect(useRouter().refresh).toHaveBeenCalled();
  });
});
