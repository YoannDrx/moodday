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
