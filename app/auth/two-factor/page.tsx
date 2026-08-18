import type { Metadata } from "next";

import { TwoFactorChallenge } from "./two-factor-challenge";

export const metadata: Metadata = {
  title: "Vérification en deux étapes",
  description: "Confirmez votre connexion Moodday.",
};

export default function TwoFactorPage() {
  return <TwoFactorChallenge />;
}
