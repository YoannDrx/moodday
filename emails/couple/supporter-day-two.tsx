import { EMAIL_URLS } from "../utils/email-constants";
import { CoupleEmail, Paragraph } from "./couple-email";

type Props = {
  userName: string;
  lessonSlug: string;
  lessonTitle: string;
  unsubscribeUrl?: string;
};

export const subject = "Deux minutes aujourd'hui ?";

export default function SupporterDayTwoEmail({
  userName = "Tom",
  lessonSlug = "jour-2-ce-qui-se-passe-dans-son-corps",
  lessonTitle = "Ce qui se passe dans son corps",
  unsubscribeUrl = EMAIL_URLS.lifecycleUnsubscribe("preview"),
}: Props) {
  return (
    <CoupleEmail
      preview={`Leçon du jour : ${lessonTitle.toLowerCase()}.`}
      title={`Leçon du jour : ${lessonTitle}`}
      greeting={`Salut ${userName},`}
      cta={{
        label: "Lire la leçon (2 min)",
        href: EMAIL_URLS.ally(lessonSlug),
      }}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Paragraph>
        Le temps d'un café, tu en sauras plus que la plupart des gens. Et à la
        fin, un mini-quiz pour vérifier que c'est bien rentré. Pas de note, pas
        de bulletin.
      </Paragraph>
    </CoupleEmail>
  );
}
