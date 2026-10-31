# Séquence d'e-mails Moodday

**Mise à jour : 31 octobre 2026.** Templates dans `emails/couple/`, planification dans
`src/features/couple/lifecycle-plan.ts` (logique pure, testée), envoi dans
`src/features/couple/lifecycle.service.ts`, déclenché toutes les heures par
`/api/cron/notifications` (job `lifecycle-emails`), seulement si `RESEND_API_KEY` est configurée.

## Règles

- **Jamais aucune donnée de santé** : ni état du jour, ni symptôme, ni besoin, ni
  date de règles. Seulement des conseils produit. Un test vérifie chaque template.
- **Un e-mail au plus par personne et par passage**, entre **9 h et 20 h** dans son fuseau.
- **Une seule fois par étape** : la ligne `LifecycleEmail(userId, step)` est réservée
  avant l'envoi, et libérée si l'envoi échoue (nouvel essai au passage suivant).
- **Fenêtre de 45 jours** après la fin de l'onboarding : les comptes plus anciens
  n'entrent jamais dans la séquence quand une étape est ajoutée.
- **Désinscription en un clic** : lien signé (HMAC) en pied de chaque e-mail →
  `/emails/unsubscribe` (bouton, pas un lien GET, pour que les antivirus de
  messagerie ne désinscrivent personne) ; interrupteur dans Réglages > Mes données.
  Les e-mails de sécurité (vérification, mot de passe, nouvelle connexion) ne sont
  pas concernés.

## Côté « c'est mon cycle »

| Étape           | Quand    | Condition         | Objet                                                | Action                           |
| --------------- | -------- | ----------------- | ---------------------------------------------------- | -------------------------------- |
| `owner_welcome` | J0 à J3  | toujours          | Bienvenue au chaud                                   | Faire mon point                  |
| `owner_invite`  | J2 à J10 | pas de duo actif  | Et si ton duo s'y mettait aussi ?                    | Inviter mon duo                  |
| `owner_rhythm`  | J5 à J14 | moins de 3 points | Dix secondes par jour, et Moodday apprend ton rythme | Faire mon point (+ encadré 3114) |

## Côté partenaire

| Étape                  | Quand       | Condition          | Objet                                          | Action              |
| ---------------------- | ----------- | ------------------ | ---------------------------------------------- | ------------------- |
| `supporter_welcome`    | J0 à J3     | toujours           | Bienvenue dans le Programme Allié              | Commencer le jour 1 |
| `supporter_day_two`    | J1 à J7     | moins de 2 leçons  | Deux minutes aujourd'hui ?                     | Leçon suivante      |
| `supporter_invite`     | J3 à J14    | pas de duo actif   | Un message tout prêt pour lui proposer Moodday | Former notre duo    |
| `supporter_graduation` | jusqu'à J45 | 7 leçons terminées | Programme Allié terminé. Respect.              | Voir mon duo        |

## Commun

| Étape           | Quand                                                    | Objet                                               |
| --------------- | -------------------------------------------------------- | --------------------------------------------------- |
| `duo_formed`    | dans les 7 jours après la formation du duo (prioritaire) | Votre duo est formé (texte différent selon le côté) |
| liste d'attente | à l'inscription sur la liste, une seule fois             | C'est noté, on te garde une place au chaud          |

## À valider avant production

- Base légale des e-mails d'onboarding (intérêt légitime, service souscrit) et
  mention dans la politique de confidentialité.
- Domaine d'envoi Resend (SPF, DKIM, DMARC) et en-tête `List-Unsubscribe` si
  l'adaptateur d'envoi l'expose.
- Relecture des textes par la personne en charge de la marque.
- Prévisualisation : `pnpm email` (React Email) puis dossier `emails/couple`.
