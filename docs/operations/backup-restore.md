# Runbook sauvegarde et restauration

Statut : la restauration logique locale est automatisée ; la restauration du
snapshot fournisseur reste à exécuter sur un clone anonymisé avant production.

## Preuve locale reproductible

`pnpm verify:backup-restore` crée deux bases jetables dans un conteneur
PostgreSQL 17 dédié, applique les migrations à la source, crée uniquement un
fixture synthétique, produit un dump logique au format custom puis le restaure
dans la destination. Le script compare les volumes des 41 tables, la valeur
numérique `0`, l'historique Prisma et le diff de schéma, puis détruit le dump et
les deux bases.

Dernière répétition : PostgreSQL 17.11 Alpine, le 18 août 2026. Le dump
synthétique de 116 962 octets a pris 389 ms, la restauration 552 ms et le RPO
observé 9 s. Cette répétition a aussi rendu le nettoyage compatible avec les
images minimales BusyBox (`stat -c` et `rm -f`) ; un test interdit le retour
des variantes GNU incompatibles.
Ces mesures locales ne remplacent pas la preuve chronométrée du fournisseur.

Le script refuse toute cible non locale. Les noms des deux bases doivent
commencer respectivement par `moodday_backup_source` et
`moodday_backup_restore`, le conteneur doit être dédié (ou fourni par le service
PostgreSQL CI) et `BACKUP_RESTORE_ACK=local-disposable` est obligatoire. Cette
preuve mesure un RTO et un RPO locaux ; elle ne démontre pas les engagements du
fournisseur Production.

## Préparation

- Identifier explicitement l'ID de branche/base source et l'ID de destination.
- Vérifier que la destination est jetable et ne contient aucune donnée utile.
- Noter volumes par table et dernière migration, sans lire les colonnes de
  contenu.
- Créer un snapshot fournisseur et consigner son identifiant et sa rétention.

## Répétition

1. Restaurer dans une branche/base isolée.
2. Exécuter `prisma migrate status`, puis `prisma migrate deploy` avec l'URL de
   cette destination uniquement.
3. Comparer le nombre de lignes, contraintes, index et tables obligatoires.
4. Lancer les smoke tests avec des comptes synthétiques.
5. Mesurer RTO (durée de restauration) et RPO (âge des données restaurées).
6. Supprimer la destination selon la procédure fournisseur après validation.

## Conditions de succès

- Toutes les migrations sont appliquées une seule fois.
- Aucune donnée de contenu n'est apparue dans les sorties de commande.
- Les volumes et relations sont cohérents.
- Connexion, check-in, prise, export et suppression synthétiques fonctionnent.
- RTO/RPO sont acceptés par le propriétaire métier.

`prisma db push` et les commandes de reset sont interdits contre une base de
production. En cas d'ambiguïté sur la cible, interrompre l'opération.
