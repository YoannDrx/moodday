# Moodday — baseline avant finalisation production

Date : 12 août 2026

Branche : `codex/moodday-production-readiness`

## État initial vérifié

- `pnpm test:ci` : 229 tests réussis dans 33 fichiers.
- `pnpm ts` : réussi.
- `pnpm lint:ci` : réussi.
- `pnpm build` : réussi, 61 routes générées.
- `pnpm audit --prod` : échec, avec avis critiques et élevés dans l'arbre
  runtime, notamment Better Auth et Next.js.
- Playwright : 12 scénarios documentés comme réussis sur une base Preview
  isolée ; la suite locale n'a pas été rejouée sans base E2E jetable.
- Knip : bloqué initialement par la validation de base exécutée à l'import de
  `playwright.config.ts`.

## Risques servant de tests de non-régression

- File hors ligne non liée à un utilisateur.
- Export patient incluant des contributions aidant cachées.
- Lecture d'historique aidant après révocation.
- Adresse e-mail non obligatoirement vérifiée.
- Webhook Resend non signé.
- Avatar Blob susceptible de survivre à la suppression du compte.
- Rappels push susceptibles de rester liés à un appareil après déconnexion.
- Calculs journaliers non uniformément basés sur le fuseau utilisateur.

Cette baseline reste historique. La source de vérité du gate courant est
`docs/operations/production-release-gates.md`.
