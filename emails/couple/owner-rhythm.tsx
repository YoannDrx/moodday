import { EMAIL_URLS } from "../utils/email-constants";
import { Aside, CoupleEmail, Paragraph } from "./couple-email";

type Props = { userName: string; unsubscribeUrl?: string };

export const subject = "Dix secondes par jour, et Moodday apprend ton rythme";

export default function OwnerRhythmEmail({
  userName = "Léa",
  unsubscribeUrl = EMAIL_URLS.lifecycleUnsubscribe("preview"),
}: Props) {
  return (
    <CoupleEmail
      preview="Pas besoin d'y penser tous les jours : quelques points par cycle suffisent."
      title="Dix secondes, et c'est tout"
      greeting={`Bonjour ${userName},`}
      cta={{ label: "Faire mon point", href: EMAIL_URLS.today() }}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Paragraph>
        Pas besoin d'être assidue comme une élève modèle. Quelques points par
        cycle, surtout les jours où ça tangue, et Moodday commence à te montrer
        des repères : après deux cycles, tu vois quand tes journées plus
        difficiles ont tendance à arriver.
      </Paragraph>
      <Paragraph>
        Astuce : active le rappel du soir dans tes réglages. Il reste discret
        sur l'écran verrouillé, et il se tait si tu as déjà fait ton point.
      </Paragraph>
      <Aside>
        Si chaque mois les jours d'avant les règles deviennent vraiment lourds,
        parles-en à un ou une professionnelle de santé : ta trace jour après
        jour peut l'aider. Et si tu te sens en détresse, le 3114 répond 24 h/24,
        gratuitement.
      </Aside>
    </CoupleEmail>
  );
}
