# Preuve Neon — clonage et contrôle de restauration isolée

Date UTC : 22 août 2026 19:00
Projet : `cool-grass-93927297`
Branche source : `br-snowy-glade-agsyake2` (`main`)
Sauvegarde pré-déploiement conservée : `br-broad-lake-ag40qezr`
Branche temporaire supprimée après contrôle : `br-noisy-truth-agkpra2f`

## Procédure exécutée

1. Création de la branche jetable `codex-restore-proof-2026-08-22` depuis la
   branche Production courante.
2. Lecture exclusive de métadonnées techniques : version PostgreSQL, nombre de
   tables, état et nom des migrations Prisma.
3. Comparaison fournisseur du schéma de la branche restaurée avec son parent.
4. Suppression explicite de la branche jetable après validation.

Aucune URL de connexion, valeur de secret, donnée de santé, note libre, adresse
e-mail ou volume par utilisateur n'a été lu ni écrit dans cette preuve.

## Résultats

| Contrôle | Résultat |
| --- | ---: |
| Version PostgreSQL | 17 |
| Tables publiques | 64 |
| Migrations Prisma réussies | 27 |
| Migrations incomplètes | 0 |
| Dernière migration | `20260822023000_v2_appointment_artifacts` |
| Diff de schéma avec la branche source | vide |
| Nettoyage de la branche temporaire | confirmé |

## Conclusion et limites

Le clonage fournisseur reproduit fidèlement le schéma Production et son
historique de migrations. La sauvegarde pré-déploiement V2 reste intacte.

La gate globale de sauvegarde/restauration reste ouverte : le projet annonce
actuellement une rétention d'historique de 6 heures et la branche Production
n'est pas protégée. Il reste à obtenir une offre/politique compatible avec 30
jours, protéger la branche, créer une restauration depuis un point historique,
faire basculer une application de test sur cette cible, rejouer les smoke tests
synthétiques et mesurer le RPO/RTO complet.
