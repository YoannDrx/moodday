import { EMAIL_URLS } from "../utils/email-constants";
import { Aside, Bullets, CoupleEmail, Paragraph } from "./couple-email";

type Props = { userName: string; unsubscribeUrl?: string };

export const subject = "Et si ton duo s'y mettait aussi ?";

export default function OwnerInviteEmail({
  userName = "Léa",
  unsubscribeUrl = EMAIL_URLS.lifecycleUnsubscribe("preview"),
}: Props) {
  return (
    <CoupleEmail
      preview="Tu n'as plus à tout expliquer. Il ou elle saura quoi faire."
      title="Et si ton duo s'y mettait aussi ?"
      greeting={`Bonjour ${userName},`}
      cta={{ label: "Inviter mon duo", href: EMAIL_URLS.duo() }}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Paragraph>
        Moodday marche très bien en solo. À deux, il fait autre chose : quand tu
        fais ton point, ton duo reçoit une notification discrète avec deux ou
        trois idées concrètes, et te répond par un geste.
      </Paragraph>
      <Bullets
        items={[
          "Tu choisis ce qu'il ou elle voit, avec un aperçu exact avant de valider.",
          "Une pause de 48 h quand tu veux souffler, sans te justifier.",
          "Tu peux arrêter le partage d'un tap. Personne ne saisit rien à ta place.",
        ]}
      />
      <Aside>
        Ton duo n'a pas encore de compte ? Ton code d'invitation lui permet d'en
        créer un en deux minutes, et le Programme Allié l'attend.
      </Aside>
    </CoupleEmail>
  );
}
