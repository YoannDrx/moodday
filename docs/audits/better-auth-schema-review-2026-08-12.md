# Revue du schéma Better Auth 1.6.27

Date initiale : 12 août 2026 — régénération contrôlée : 13 août 2026
Commande : `pnpm better-auth:migrate`

La CLI officielle autonome `auth@1.6.27` génère la source de référence dans
`prisma/generated/better-auth.prisma`. L’ancien paquet
`@better-auth/cli@1.4.21` a été retiré : il embarquait un cœur Better Auth 1.4
incompatible avec le runtime 1.6.27.

## Résultat de la revue

- Les modèles `TwoFactor` et `Passkey`, leurs champs et leurs index concordent
  avec la sortie de la CLI 1.6.27.
- Les index Better Auth sur `Session.userId`, `Account.userId`,
  `Verification.identifier`, `TwoFactor.userId`, `TwoFactor.secret`,
  `Passkey.userId` et `Passkey.credentialID` sont présents.
- Les champs Moodday additionnels du modèle `User` et les relations vers le
  domaine restent dans le schéma fusionné ; ils ne sont pas inventés par la
  CLI et ne doivent pas être perdus lors d’une régénération.
- Les colonnes historiques de dates Better Auth restent compatibles avec la
  structure existante. La release additive ne resserre pas leur nullabilité et
  ne fabrique ni vérification d'e-mail ni consentement.
- La régénération du 13 août inclut le champ d'entrée additionnel
  `healthDataConsentVersionAccepted`. La migration reste additive et les
  comptes historiques doivent accepter eux-mêmes la finalité `health_data` ;
  aucun backfill n'est autorisé.

Toute nouvelle version Better Auth exige de régénérer la source de référence,
de revoir le diff avec ce schéma fusionné, puis de créer une migration Prisma
additive distincte.
