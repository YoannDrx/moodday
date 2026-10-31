import { EMAIL_URLS } from "../utils/email-constants";
import { CoupleEmail, Paragraph } from "./couple-email";

type Props = {
  userName: string;
  partnerName: string;
  role: "cycle_owner" | "supporter";
  unsubscribeUrl?: string;
};

export const subject = "Votre duo est formé";

export default function DuoFormedEmail({
  userName = "Léa",
  partnerName = "Tom",
  role = "cycle_owner",
  unsubscribeUrl = EMAIL_URLS.lifecycleUnsubscribe("preview"),
}: Props) {
  return (
    <CoupleEmail
      preview={`${userName} & ${partnerName}, bienvenue à deux.`}
      title={`${userName} & ${partnerName}, bienvenue à deux`}
      cta={
        role === "cycle_owner"
          ? { label: "Choisir ce que je partage", href: EMAIL_URLS.duo() }
          : { label: "Voir mon duo", href: EMAIL_URLS.today() }
      }
      unsubscribeUrl={unsubscribeUrl}
    >
      {role === "cycle_owner" ? (
        <Paragraph>
          {partnerName} a rejoint ton duo. Prends une minute pour vérifier ce
          qu'il ou elle voit : tu as un aperçu exact dans l'onglet Duo, et tu
          peux tout changer, mettre en pause ou arrêter quand tu veux.
        </Paragraph>
      ) : (
        <Paragraph>
          Te voilà relié·e à {partnerName}. Quand elle fait son point, tu reçois
          une notification sobre avec deux ou trois idées concrètes. Un tap, et
          elle voit ton geste. Pas de point ? Pas de nouvelles, peut-être bonne
          nouvelle.
        </Paragraph>
      )}
    </CoupleEmail>
  );
}
