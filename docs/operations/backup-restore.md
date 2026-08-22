# Runbook sauvegarde et restauration

Statut : la restauration logique locale est automatisée et le clonage isolé
Neon de l'état Production a été prouvé le 22 août 2026. La répétition complète
depuis un point historique, avec bascule applicative chronométrée et rétention
30 jours, reste à exécuter avant toute bêta externe.

## Preuve locale reproductible

`pnpm verify:backup-restore` crée deux bases jetables dans un conteneur
PostgreSQL 17 dédié, applique les migrations à la source, crée uniquement un
fixture synthétique, produit un dump logique au format custom puis le restaure
dans la destination. Le script compare les volumes des 64 tables, la valeur
numérique `0`, l'historique Prisma et le diff de schéma, puis détruit le dump et
les deux bases.

Dernière répétition : PostgreSQL 17, le 22 août 2026, sur les 27 migrations et
64 tables. Le dump synthétique de 197 262 octets a pris 116 ms, la restauration
170 ms et le RPO observé 3 s. La répétition confirme également le nettoyage
compatible avec les images minimales BusyBox (`stat -c` et `rm -f`) ; un test
interdit le retour des variantes GNU incompatibles.
Ces mesures locales ne remplacent pas la preuve chronométrée du fournisseur.

## Preuve fournisseur du 22 août 2026

Une branche Neon jetable a été créée depuis la branche Production courante,
contrôlée sans lire ni afficher de contenu utilisateur, puis supprimée. Les
résultats et limites sont consignés dans
[`evidence/neon-restore-proof-2026-08-22.md`](./evidence/neon-restore-proof-2026-08-22.md).

Cette preuve valide le mécanisme de clonage et l'intégrité du schéma restauré.
Elle ne valide pas encore un RPO historique de 24 heures, une rétention de 30
jours, une bascule de l'application ni le RTO métier complet de quatre heures.

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
