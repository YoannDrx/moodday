import { describe, expect, it } from "vitest";

import {
  evaluateSignupAccess,
  normalizeSignupEmail,
  parseSignupInviteEmails,
} from "@/lib/auth/signup-access";

describe("public signup access", () => {
  it("keeps account creation closed by default", () => {
    expect(
      evaluateSignupAccess({
        mode: "closed",
        email: "person@example.test",
        invitedEmails: new Set(),
      }),
    ).toEqual({
      allowed: false,
      mode: "closed",
      code: "SIGNUP_CLOSED",
    });
  });

  it("accepts only normalized allowlisted emails in invite mode", () => {
    const invitedEmails = parseSignupInviteEmails(
      " Invited@Example.test,second@example.test ",
    );

    expect(normalizeSignupEmail(" INVITED@example.test ")).toBe(
      "invited@example.test",
    );
    expect(
      evaluateSignupAccess({
        mode: "invite",
        email: "invited@example.test",
        invitedEmails,
      }),
    ).toEqual({ allowed: true, mode: "invite" });
    expect(
      evaluateSignupAccess({
        mode: "invite",
        email: "unknown@example.test",
        invitedEmails,
      }),
    ).toMatchObject({
      allowed: false,
      code: "SIGNUP_INVITE_REQUIRED",
    });
  });

  it("allows every valid downstream request in public mode", () => {
    expect(
      evaluateSignupAccess({
        mode: "public",
        invitedEmails: new Set(),
      }),
    ).toEqual({ allowed: true, mode: "public" });
  });
});
