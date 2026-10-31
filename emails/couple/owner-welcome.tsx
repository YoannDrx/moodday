import { EMAIL_URLS } from "../utils/email-constants";
import { Bullets, CoupleEmail, Paragraph } from "./couple-email";

type Props = { userName: string; unsubscribeUrl?: string };

export const subject = "Bienvenue au chaud";

export default function OwnerWelcomeEmail({
  userName = "Léa",
  unsubscribeUrl = EMAIL_URLS.lifecycleUnsubscribe("preview"),
}: Props) {
  return (
    <CoupleEmail
      preview="Ton premier point prend dix secondes. Promis."
      title={`Bienvenue au chaud, ${userName}`}
      cta={{ label: "Faire mon point", href: EMAIL_URLS.today() }}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Paragraph>
        Ici, pas de diagnostic ni de leçon de morale : juste un endroit pour
        dire comment tu vas, et un duo qui sait enfin quoi faire.
      </Paragraph>
      <Bullets
        items={[
          "Fais ton point en dix secondes : un état, un ou deux besoins. Ta note reste privée, toujours.",
          "Note tes règles d'un tap : Moodday apprend ton rythme au fil des cycles.",
          "Invite ton duo quand tu veux, et choisis exactement ce qu'il ou elle voit.",
        ]}
      />
    </CoupleEmail>
  );
}
