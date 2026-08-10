# Runbook sauvegarde et restauration

Statut : procédure à exécuter sur un clone anonymisé avant production.

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
