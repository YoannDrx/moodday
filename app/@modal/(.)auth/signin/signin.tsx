"use client";

import { SignInProviders } from "../../../auth/signin/sign-in-providers";
import type { PublicSignupMode } from "@/lib/auth/signup-access";

export const SignInModal = (props: {
  providers: string[];
  signupMode: PublicSignupMode;
}) => {
  return (
    <SignInProviders
      providers={props.providers}
      signupMode={props.signupMode}
    />
  );
};
