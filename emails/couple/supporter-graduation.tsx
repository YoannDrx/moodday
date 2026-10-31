import { EMAIL_URLS } from "../utils/email-constants";
import { Bullets, CoupleEmail, Paragraph } from "./couple-email";

type Props = { userName: string; unsubscribeUrl?: string };

export const subject = "Programme Allié terminé. Respect.";

export default function SupporterGraduationEmail({
  userName = "Tom",
  unsubscribeUrl = EMAIL_URLS.lifecycleUnsubscribe("preview"),
}: Props) {
  return (
    <CoupleEmail
      preview="Sept leçons, zéro cliché. Ce qui compte maintenant, c'est la suite."
      title={`Bravo ${userName}, programme terminé`}
      cta={{ label: "Voir mon duo aujourd'hui", href: EMAIL_URLS.today() }}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Paragraph>
        Tu en sais désormais plus que la plupart des gens. Le plus dur reste le
        plus simple : continuer, un geste à la fois. Trois choses à garder :
      </Paragraph>
      <Bullets
        items={[
          "Proposer précis plutôt que « dis-moi si tu as besoin ».",
          "Écouter avant de réparer : « tu veux une solution ou une oreille ? »",
          "Prendre soin de toi aussi. Un allié épuisé n'aide personne.",
        ]}
      />
    </CoupleEmail>
  );
}
