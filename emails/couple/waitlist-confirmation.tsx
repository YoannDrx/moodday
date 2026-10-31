import { CoupleEmail, Paragraph } from "./couple-email";

export const subject = "C'est noté, on te garde une place au chaud";

export default function WaitlistConfirmationEmail() {
  return (
    <CoupleEmail
      preview="Un seul e-mail quand ton accès est prêt. Promis."
      title="C'est noté, on te garde une place au chaud"
    >
      <Paragraph>
        Moodday ouvre progressivement pendant la bêta. Tu recevras un seul
        e-mail, le jour où ton accès est prêt.
      </Paragraph>
      <Paragraph>
        Ton adresse ne sert qu'à ça. Pour la faire supprimer, réponds simplement
        à cet e-mail.
      </Paragraph>
    </CoupleEmail>
  );
}
