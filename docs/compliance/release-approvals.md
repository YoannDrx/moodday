# Moodday — registre des approbations externes de lancement

Statut : **toutes les approbations ci-dessous sont bloquantes et non obtenues**

Dernière revue technique : 14 août 2026

Ce registre distingue les preuves techniques produites dans le dépôt des
décisions qui exigent une autorité juridique, comptable, clinique ou un accès
au compte Production d'un fournisseur. Une ligne ne passe à `approuvé` que si
une preuve datée, nominative et vérifiable est reliée dans la dernière colonne.
L'absence de preuve vaut refus de lancement ; elle ne peut pas être remplacée
par une case cochée par l'équipe technique.

Ces décisions sont aussi représentées sans contenu confidentiel dans le
[registre exécutable](../operations/release-approval-evidence.md). Le
pré-déploiement reste bloqué tant que `pnpm verify:release-approvals` n'est pas
vert pour un même commit candidat.

## Approbations obligatoires

| Domaine                   | Décision ou preuve attendue                                                                   | Autorité requise                             | État      | Preuve datée |
| ------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------- | --------- | ------------ |
| Responsable de traitement | Identité, adresse professionnelle publiable et canal vie privée confirmés                     | Responsable de traitement                    | À obtenir | Aucune       |
| DPO                       | Décision motivée de désignation ou de non-désignation et coordonnées si désigné               | Responsable de traitement / conseil RGPD     | À obtenir | Aucune       |
| Bases légales             | Validation de chaque base article 6 et exception article 9, y compris partage aidant et IA    | Conseil RGPD                                 | À obtenir | Aucune       |
| Consentement santé        | Texte, preuve, retrait aussi simple que l'accord et conséquence du retrait validés            | Conseil RGPD                                 | À obtenir | Aucune       |
| CGU et confidentialité    | Versions finales `LEGAL_TERMS_VERSION` et `LEGAL_PRIVACY_VERSION` validées                    | Conseil juridique                            | À obtenir | Aucune       |
| AIPD                      | AIPD complète, risques résiduels acceptés et consultation CNIL décidée si nécessaire          | Responsable de traitement / DPO              | À obtenir | Aucune       |
| HDS                       | Qualification de l'activité, périmètre d'hébergement et conformité HDS v2 de la chaîne signés | Conseil santé / DPO                          | À obtenir | Aucune       |
| Sous-traitants            | DPA, régions, transferts, sous-traitants ultérieurs et mesures supplémentaires vérifiés       | Conseil RGPD                                 | À obtenir | Aucune       |
| Rétention                 | Durées produit, sauvegardes, aidants, support, DSAR et suppressions externes approuvées       | Conseil RGPD                                 | À obtenir | Aucune       |
| Incident                  | Procédure, astreinte, rôles et capacité de notification CNIL sous 72 h testés                 | Responsable de traitement / DPO              | À obtenir | Aucune       |
| Sécurité clinique         | Ressources 3114/15/112, corpus IA et absence de recommandation médicale revus                 | Professionnel compétent                      | À obtenir | Aucune       |
| OpenAI                    | DPA, transfert, traitement, texte d'information et politique IA approuvés                     | Conseil RGPD / juridique                     | À obtenir | Aucune       |
| Fiscalité                 | TVA, taxes incluses, factures, conservation et rétractation validées                          | Expert-comptable / juridique                 | À obtenir | Aucune       |
| Stripe live               | KYC, compte, catalogue EUR, portail, Test Clocks et achat-remboursement live prouvés          | Propriétaire Stripe / comptable              | À obtenir | Aucune       |
| Vercel Production         | Pro, régions, secrets, crons, logs, rétention et alertes vérifiés                             | Propriétaire Vercel                          | À obtenir | Aucune       |
| Neon Production           | Offre Production, MFA, région, branche protégée, rétention et restauration RPO/RTO prouvés    | Propriétaire Neon                            | À obtenir | Aucune       |
| GitHub Production         | Organisation Team/Enterprise, Code/Secret Security, ruleset `main` et contrôles requis actifs | Propriétaire GitHub                          | À obtenir | Aucune       |
| Resend Production         | Domaine, webhook signé, délivrabilité et alerte de watchdog vérifiés                          | Propriétaire Resend                          | À obtenir | Aucune       |
| Rotation incident Preview | DB, OAuth, Better Auth, Resend, Stripe, Blob, Cron et OpenAI tournés ; reliquats révoqués     | Propriétaires de chaque fournisseur          | À obtenir | Aucune       |
| Accessibilité             | Audit WCAG 2.2 AA manuel et remédiations acceptés                                             | Auditeur qualifié / Product                  | À obtenir | Aucune       |
| Go/no-go                  | Acceptation des risques résiduels et autorisation d'ouverture France 18+                      | Product, Engineering, juridique et comptable | À obtenir | Aucune       |

## Règles de preuve

- La preuve doit indiquer le périmètre, la date, l'auteur et la décision.
- Un e-mail d'approbation est archivé hors du dépôt ; le dépôt ne conserve
  qu'une référence non sensible et, si possible, son empreinte SHA-256.
- Aucun secret, contrat confidentiel, pièce KYC ou donnée personnelle n'est
  commité.
- Une approbation assortie de réserves reste `à obtenir` jusqu'à la fermeture
  de toutes les réserves bloquantes.
- Toute modification d'une finalité, d'un fournisseur, d'une région, d'une
  durée, d'un prix ou du texte de consentement invalide l'approbation concernée.

## Décision actuelle

Le lancement public, `BILLING_ENABLED=true`, `AI_ROLLOUT_MODE=public` et les
fonctionnalités de partage/push destinées au public sont **interdits** tant que
ce registre ne contient pas les preuves requises. Cette décision est cohérente
avec les portes techniques de
[`production-release-gates.md`](../operations/production-release-gates.md).
