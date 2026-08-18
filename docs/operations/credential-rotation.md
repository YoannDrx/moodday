# Rotation des identifiants après l'incident Preview du 14 août 2026

Ce runbook ferme la gate créée par l'inclusion d'un `.env` local dans une
preview Vercel supprimée. Il complète le
[rapport d'incident](./incidents/2026-08-14-vercel-preview-env-upload.md) et ne
constitue pas une autorisation de déploiement.

## Invariants

- Aucune valeur de clé, URL avec mot de passe, token, signature ou secret OAuth
  n'est écrite dans le dépôt, un ticket, une preuve ou une sortie de commande.
- Preview et Production reçoivent des identifiants distincts.
- La nouvelle valeur est provisionnée et testée avant révocation de l'ancienne,
  sauf pour Redis, UploadThing et PostHog qui n'ont plus de consommateur.
- Un changement Production qui peut interrompre l'authentification, la base,
  les e-mails ou les paiements suit la fenêtre de maintenance et le rollback.
- Les flags Billing, IA, aidants, push, import et administration restent fermés.
- Aucune preview n'est créée avant que
  `pnpm verify:credential-rotations` soit vert.

## Ordre d'exécution

1. Identifier un opérateur autorisé pour chaque fournisseur et ouvrir une
   preuve privée datée. La référence opaque de cette preuve peut être consignée
   dans le dépôt, jamais son contenu.
2. Examiner les journaux d'activité disponibles entre la création de la preview
   supprimée et la révocation. Consigner uniquement la conclusion et la période
   dans la preuve privée.
3. Révoquer Redis et UploadThing, puis retirer leurs variables locales et
   distantes. Retirer PostHog sans créer de nouvelle clé. Générer des secrets
   Cron et des jetons Blob distincts pour Preview et Production.
4. Créer des identifiants dédiés Preview pour Neon, GitHub OAuth, Google OAuth,
   Resend, Stripe, Blob et OpenAI. Générer un nouveau `BETTER_AUTH_SECRET` et un
   nouveau `CRON_SECRET` Preview.
5. Provisionner le coffre Preview sans copier de valeur depuis Production.
   Corriger les doublons et vérifier l'inventaire avec
   `pnpm verify:vercel-environment -- --environment=preview`.
6. Préparer les identifiants Production séparés. Pour Neon et Better Auth,
   planifier la bascule dans la fenêtre de maintenance : la rotation peut
   invalider les connexions et sessions actives.
7. Pour chaque fournisseur, prouver un contrôle non sensible après bascule :
   connexion DB, callback OAuth, envoi e-mail, signature webhook, validation du
   catalogue Stripe ou appel OpenAI synthétique selon le périmètre.
8. Révoquer l'ancienne valeur, refaire la revue d'activité, puis mettre à jour
   le registre structuré.
9. Exécuter `pnpm verify:credential-rotations`, puis
   `pnpm verify:vercel-predeploy`. Une sortie rouge interdit toujours le
   déploiement.
10. Créer une preview, vérifier l'absence d'avertissement `.env`, puis exécuter
    `/api/health`, les smoke tests publics, les parcours auth et l'inspection des
    erreurs runtime avant toute décision Production.

## Registre de preuve

Le fichier
[`evidence/credential-rotation-2026-08-14.json`](./evidence/credential-rotation-2026-08-14.json)
ne contient que des métadonnées et références opaques :

- `oldCredentialDisabledAt` : révocation ou retrait confirmé ;
- `newCredentialProvisionedAt` : nouvelle valeur installée pour une rotation ;
- `activityReviewedAt` : journaux ou activité fournisseur contrôlés ;
- `evidenceReference` : référence privée, par exemple
  `vault-record:rotation-2026-08-neon` ;
- `operatorReference` : identifiant interne non personnel de l'opérateur.

Passer `status` à `completed` sans toutes les dates et références maintient la
gate rouge. Les dates futures, fournisseurs dupliqués, actions modifiées et
fournisseurs absents sont également rejetés.

## Rollback

Si un contrôle post-bascule échoue, conserver l'ancienne valeur active lorsque
le fournisseur le permet, rétablir la configuration précédente, fermer les
flags sensibles et maintenir ou réactiver la maintenance. Ne révoquer
l'ancienne valeur qu'après un contrôle réussi. Si elle a déjà été révoquée,
générer une nouvelle valeur ; ne jamais réutiliser le secret compromis.
