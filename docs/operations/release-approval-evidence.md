# Gate de preuves d'approbation de release

La commande `pnpm verify:release-approvals` empêche un pré-déploiement tant que
les approbations humaines et fournisseur obligatoires ne sont pas toutes
reliées à une preuve externe. Le registre exécutable est
`docs/operations/evidence/release-approvals-2026-08.json`.

## Principes

- Le registre ne contient jamais de contrat, e-mail, nom personnel, secret,
  pièce KYC ou donnée de santé.
- `evidenceReference` est une référence opaque vers la preuve conservée dans
  le coffre documentaire autorisé.
- `approverReference` est un identifiant interne non personnel ou pseudonymisé.
- `releaseCommit` désigne le même commit candidat pour les 21 approbations.
- Le commit qui ajoute les références de preuve peut être postérieur au commit
  candidat, mais il ne doit modifier que les preuves et métadonnées de release.
- Une approbation expirée, future, dupliquée, absente ou liée à un autre commit
  maintient la gate rouge.
- Le JSON n'est jamais affiché par le script ; seules les catégories d'erreur
  sont écrites dans les logs.

## Procédure

1. Figer le commit candidat après réussite de `pnpm verify`, couverture release,
   E2E et répétitions de migration/restauration.
2. Faire examiner ce même commit par chaque autorité définie dans
   `docs/compliance/release-approvals.md`.
3. Conserver les décisions signées hors du dépôt et relever leurs références
   opaques.
4. Pour chaque exigence, passer `status` à `approved`, renseigner la date, la
   référence, l'approbateur interne et le commit candidat. Renseigner
   `validUntil` lorsque la preuve a une date d'expiration.
5. Vérifier que le diff ne contient aucun contenu confidentiel.
6. Exporter le SHA exact avec
   `export RELEASE_CANDIDATE_COMMIT=<sha-40-caracteres>`, puis exécuter
   `pnpm verify:release-approvals` et
   `pnpm verify:vercel-predeploy`.
7. Toute modification ultérieure du code, d'un prix, d'une finalité, d'un
   fournisseur, d'une région, d'une rétention ou d'un texte légal invalide le
   go/no-go et impose une nouvelle revue du commit.

Cette gate vérifie la présence, la cohérence et la fraîcheur des références ;
elle ne peut pas authentifier seule l'autorité juridique ou clinique. La revue
humaine des preuves externes reste obligatoire pendant le go/no-go.

La gate ne peut devenir verte que si le candidat existe dans Git, est un
ancêtre du HEAD, correspond aux 21 approbations et que le worktree est propre.
Après le candidat, seuls les deux registres JSON de preuves sont autorisés à
changer ; toute modification de code ou de documentation invalide la release.

## Profils de publication (octobre 2026)

`releaseScope` accepte désormais `core-beta`, `commercial`, `ai` et `native`, en plus du registre historique complet. Tous conservent notamment les exigences HDS, AIPD, consentement, sécurité clinique, rotation et go/no-go. `commercial` ajoute fiscalité et Stripe ; `ai` ajoute le traitement OpenAI ; `native` ajoute validation appareil et revue store. Une publication combinant les modules doit réunir leurs preuves : ne pas utiliser un profil plus étroit pour les activer.

Pour préparer la bêta gratuite : `RELEASE_APPROVAL_EVIDENCE_PATH=docs/operations/evidence/release-approvals-core-beta-2026-10.json pnpm verify:release-approvals`. Toutes les entrées de ce nouveau registre restent en attente. Le script refuse facturation, IA ou livraison native activées en dehors de son périmètre (`BILLING_ENABLED`, `AI_INSIGHTS_ENABLED`, `NATIVE_RELEASE_ENABLED`). Utiliser les valeurs réelles du candidat lors du contrôle ; l’absence d’une variable dans le terminal ne démontre pas la configuration de production.

Les fournisseurs OAuth exigent désormais leur flag serveur `OAUTH_GOOGLE_ENABLED`, `OAUTH_APPLE_ENABLED` ou `OAUTH_GITHUB_ENABLED`, désactivé par défaut, en plus des clés. Les builds natifs doivent aligner `EXPO_PUBLIC_OAUTH_GOOGLE_ENABLED` et `EXPO_PUBLIC_OAUTH_APPLE_ENABLED` avec les fournisseurs réellement validés du serveur. Conserver une preuve de connexion, annulation, retour mobile et refus d’inscription avant activation. Les variables publiques ne contiennent aucun secret.

Pour auditer les variables réelles de la bêta : `pnpm verify:vercel-environment -- --profile=core-beta --compare-values`. Le profil déclenche une lecture sécurisée des valeurs Vercel ; les secrets ne sont pas affichés. Seul un flag explicitement `false` rend les clés de son module facultatives. Les exigences d’isolation des secrets présents continuent de s’appliquer, même si leur module est fermé. Sans `--profile`, l’inventaire historique complet est conservé.
