import { EMAIL_URLS } from "../utils/email-constants";
import { Aside, CoupleEmail, Paragraph } from "./couple-email";

type Props = { userName: string; unsubscribeUrl?: string };

export const subject = "Un message tout prêt pour lui proposer Moodday";

export default function SupporterInviteEmail({
  userName = "Tom",
  unsubscribeUrl = EMAIL_URLS.lifecycleUnsubscribe("preview"),
}: Props) {
  return (
    <CoupleEmail
      preview="Le plus dur, c'est le premier message. On l'a écrit pour toi."
      title="Le plus dur, c'est le premier message"
      greeting={`Salut ${userName},`}
      cta={{ label: "Former notre duo", href: EMAIL_URLS.duo() }}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Paragraph>
        Proposer une app sur son cycle, ça peut faire peur. Le bon ton, c'est
        l'humilité : tu ne viens pas la surveiller, tu viens apprendre.
      </Paragraph>
      <Aside>
        « J'ai commencé un programme pour mieux comprendre ton cycle. Tu veux
        qu'on essaie ensemble ? C'est toi qui choisis ce que tu partages. »
      </Aside>
      <Paragraph>
        Elle crée son espace, choisit exactement ce que tu vois, et peut tout
        mettre en pause à tout moment. Si elle dit non, c'est non : le Programme
        Allié reste à toi.
      </Paragraph>
    </CoupleEmail>
  );
}
