// Better Auth sends social sign-in failures back to the sign-in page as an
// `error` query parameter. Only known codes get a specific message; the value
// itself is never displayed because anyone can put text in the URL.
const SIGN_IN_ERROR_MESSAGES = {
  signup_disabled: "auth.signIn.errors.signupClosed",
  signup_invite_required: "auth.signIn.errors.inviteRequired",
  account_not_linked: "auth.signIn.errors.accountNotLinked",
  access_denied: "auth.signIn.errors.cancelled",
} as const;

export type SignInErrorMessageKey =
  | (typeof SIGN_IN_ERROR_MESSAGES)[keyof typeof SIGN_IN_ERROR_MESSAGES]
  | "auth.signIn.errors.generic";

export const getSignInErrorMessageKey = (
  error: string | null,
): SignInErrorMessageKey | null => {
  if (!error) return null;
  return Object.hasOwn(SIGN_IN_ERROR_MESSAGES, error)
    ? SIGN_IN_ERROR_MESSAGES[error as keyof typeof SIGN_IN_ERROR_MESSAGES]
    : "auth.signIn.errors.generic";
};
