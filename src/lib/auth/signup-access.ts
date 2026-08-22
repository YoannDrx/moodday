import { env } from "@/lib/env";

export type PublicSignupMode = "closed" | "invite" | "public";

export type SignupAccessDecision =
  | { allowed: true; mode: PublicSignupMode }
  | {
      allowed: false;
      mode: Exclude<PublicSignupMode, "public">;
      code: "SIGNUP_CLOSED" | "SIGNUP_INVITE_REQUIRED";
    };

export const normalizeSignupEmail = (email: string) =>
  email.trim().toLocaleLowerCase("en-US");

export const parseSignupInviteEmails = (value: string | undefined) =>
  new Set((value ?? "").split(",").map(normalizeSignupEmail).filter(Boolean));

export const evaluateSignupAccess = ({
  mode,
  email,
  invitedEmails,
}: {
  mode: PublicSignupMode;
  email?: string;
  invitedEmails: ReadonlySet<string>;
}): SignupAccessDecision => {
  if (mode === "public") return { allowed: true, mode };
  if (mode === "closed") {
    return { allowed: false, mode, code: "SIGNUP_CLOSED" };
  }

  if (email && invitedEmails.has(normalizeSignupEmail(email))) {
    return { allowed: true, mode };
  }

  return { allowed: false, mode, code: "SIGNUP_INVITE_REQUIRED" };
};

export const getSignupAccess = (email?: string) =>
  evaluateSignupAccess({
    mode: env.PUBLIC_SIGNUP_MODE,
    email,
    invitedEmails: parseSignupInviteEmails(env.PUBLIC_SIGNUP_INVITE_EMAILS),
  });
