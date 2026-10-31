import { EMAIL_URLS } from "../utils/email-constants";
import { Bullets, CoupleEmail, Paragraph } from "./couple-email";

type Props = { userName: string; lessonSlug: string; unsubscribeUrl?: string };

export const subject = "Bienvenue dans le Programme Allié";

export default function SupporterWelcomeEmail({
  userName = "Tom",
  lessonSlug = "jour-1-le-spm-sans-cliches",
  unsubscribeUrl = EMAIL_URLS.lifecycleUnsubscribe("preview"),
}: Props) {
  return (
    <CoupleEmail
      preview="Personne ne t'a appris le SPM. Sept jours, deux minutes par jour."
      title={`Bienvenue, ${userName}`}
      cta={{ label: "Commencer le jour 1", href: EMAIL_URLS.ally(lessonSlug) }}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Paragraph>
        Personne ne t'a appris le SPM, et ce n'est pas ta faute. Le Programme
        Allié, c'est sept jours, deux minutes par jour : ce qui se passe
        vraiment, les phrases qui blessent, et comment aider sans tout prendre
        en charge.
      </Paragraph>
      <Paragraph>Trois règles du jeu, et tout le reste en découle :</Paragraph>
      <Bullets
        items={[
          "C'est elle qui décide de ce que tu vois, quand, et pour combien de temps.",
          "Tu ne saisis rien sur elle. Ton rôle : comprendre et répondre.",
          "Le calendrier n'est pas une météo. Seul son point du jour dit comment elle va.",
        ]}
      />
    </CoupleEmail>
  );
}
