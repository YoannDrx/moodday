# Incident — inclusion d'un `.env` local dans une preview Vercel

Date : 14 août 2026
Statut : contenu, rotations fournisseurs encore requises
Portée : preview uniquement, jamais promue en Production

## Détection

Pendant la première preview manuelle du worktree de préparation Production, le
build distant a émis l'avertissement `Detected .env file`. La preview concernée
portait l'identifiant `dpl_6FGWyqLsSt2jLUX5CrTkJjXLULQ5` et n'a reçu aucun alias
Production.

L'inventaire local réalisé sans afficher les valeurs montre que ce `.env`
contenait des identifiants ou secrets pour PostgreSQL, Redis, GitHub OAuth,
Google OAuth, Better Auth, Resend, Stripe et UploadThing. Les identifiants
publics Stripe, les anciens identifiants de prix et les clés publiques PostHog
ne sont pas des secrets, mais doivent quand même être retirés du fichier local
s'ils ne sont plus utilisés.

Le fichier `.env.local`, qui contient notamment la clé OpenAI dédiée, n'a pas
été nommé par l'avertissement observé. Il reste néanmoins exclu par la nouvelle
règle globale `.env.*` et aucune conclusion d'absence d'exposition ne repose sur
ce seul constat. Si Vercel ne peut pas fournir de preuve concluante sur le
contenu du paquet supprimé, la clé OpenAI dédiée doit elle aussi être tournée
par précaution avant la prochaine preview.

## Contention effectuée

1. La preview précise a été supprimée immédiatement avec `vercel rm`.
2. Aucune promotion, aucun alias Production et aucune activation de flag n'ont
   eu lieu.
3. `.vercelignore` exclut désormais `.env` et toutes les variantes `.env.*`,
   sans exception négative.
4. `pnpm verify:vercel-source-boundary` et un test Vitest bloquent la disparition
   de cette protection.
5. Toute nouvelle preview manuelle est suspendue jusqu'à la rotation des
   secrets concernés.
6. Le [runbook de rotation](../credential-rotation.md), son registre structuré
   et `pnpm verify:credential-rotations` exigent des preuves datées avant la
   reprise.

## Mesure préventive complémentaire — 18 août 2026

Après le passage du dépôt GitHub en visibilité publique, deux déploiements
Preview générés automatiquement à partir de branches Dependabot ont été trouvés
accessibles sans authentification. Cette observation ne constitue pas une
preuve d'accès à une donnée utilisateur, mais elle réouvrait inutilement une
surface fondée sur l'ancien `main` et sur le coffre Preview encore en cours de
rotation.

- Le déploiement exact `dpl_BPZKSAqcEfURb8chctiA47kNN9Vv` a été supprimé. Son
  URL répond désormais `404 DEPLOYMENT_NOT_FOUND`. Le déploiement supprimé
  n'est pas restaurable comme objet Vercel ; son code reste reproductible à
  partir du commit Git concerné si une nouvelle preview contrôlée est un jour
  nécessaire.
- Vercel Authentication a ensuite été activée au niveau du seul projet avec
  `ssoProtection.deploymentType=preview`. Le réglage ne couvre donc pas la
  Production.
- Un second Preview Dependabot, qui répondait `200` avant la mutation, répond
  désormais par une redirection vers l'authentification Vercel. Le domaine
  canonique Production répond toujours `200`.
- `gitForkProtection` reste actif. Aucun bypass supplémentaire, aucun secret,
  aucun domaine et aucun déploiement Production n'a été créé ou modifié pendant
  cette contention.

Cette protection limite l'exposition des futurs Previews, mais ne ferme pas la
gate de rotation : aucun nouveau déploiement de validation ne doit être lancé
avant révocation des anciennes valeurs et séparation complète des coffres.

## Rotations obligatoires avant nouvelle preview

- identifiants PostgreSQL présents dans le `.env` ;
- mot de passe/URL Redis : aucune référence applicative actuelle, donc
  révocation et retrait plutôt que renouvellement ;
- secret OAuth GitHub ;
- secret OAuth Google ;
- `BETTER_AUTH_SECRET` ;
- clé API Resend et vérification de ses journaux d'utilisation ;
- clé Stripe secrète et secret webhook présents dans ce fichier ;
- jeton Blob et `CRON_SECRET`, dont l'audit de valeurs a prouvé la réutilisation
  entre Preview et Production ;
- token UploadThing : aucune référence applicative actuelle, donc révocation et
  retrait. Les variables PostHog locales, elles aussi sans consommateur dans la
  release, doivent être retirées sans ajouter de nouveau secret.
- clé OpenAI dédiée si l'absence du fichier `.env.local` dans l'artefact ne peut
  pas être démontrée par le fournisseur.

Après chaque rotation : mettre à jour uniquement le coffre de l'environnement
concerné et les fichiers locaux ignorés, contrôler les journaux fournisseur,
révoquer l'ancienne valeur, puis dater la preuve dans le registre
d'approbations. Les nouvelles clés Preview et Production doivent être
distinctes.

## Vérifications de sortie

- [ ] Toutes les rotations ci-dessus sont datées et reliées à une preuve.
- [ ] Les anciennes clés sont révoquées et leurs journaux contrôlés.
- [ ] Les variables Redis, PostHog et UploadThing inutilisées ont été retirées.
- [ ] Blob, Cron et Resend utilisent des valeurs distinctes entre Preview et
      Production.
- [ ] Une nouvelle preview distante ne contient plus l'avertissement `.env`.
- [ ] La preview passe `/api/health`, les smoke tests publics et un contrôle des
      erreurs runtime sans `Invalid origin`.
- [ ] La Production n'a subi aucune modification de code ou de secret à cause
      de cet incident.
