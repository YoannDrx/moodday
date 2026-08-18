# Audit Neon de préparation Production — 14 août 2026

Périmètre : lecture seule des métadonnées projets, branches, computes et de la
table technique `_prisma_migrations`. Aucune table métier, donnée utilisateur,
chaîne de connexion ou valeur de secret n'a été lue ou affichée.

## Résultats prouvés

| Contrôle                   | Production                                          | Preview             | Décision                                          |
| -------------------------- | --------------------------------------------------- | ------------------- | ------------------------------------------------- |
| Projet dédié               | `moodday`                                           | `moodday-preview`   | Isolation de projet confirmée                     |
| Offre organisation         | Free                                                | Free                | Gate rouge pour les contrôles Production attendus |
| MFA organisationnel requis | non                                                 | non                 | Gate rouge d'accès administrateur                 |
| Région                     | `aws-eu-central-1`                                  | `aws-eu-central-1`  | Région européenne confirmée techniquement         |
| PostgreSQL                 | 17.10                                               | 18.4                | Gate rouge : versions différentes                 |
| Branche primaire           | `main`, prête                                       | `production`, prête | Branches distinctes                               |
| Protection                 | désactivée                                          | désactivée          | Gate rouge pour la branche Production             |
| Historique PITR            | 21 600 s, soit 6 h                                  | 21 600 s, soit 6 h  | Gate rouge pour la cible 30 jours                 |
| Migrations appliquées      | 12                                                  | 12                  | Baseline identique, release cible à 24            |
| Migration incomplète       | 0                                                   | 0                   | État actuel cohérent                              |
| Dernière migration         | `20260810120000_subscription_updated_at_no_default` | identique           | Parité de baseline confirmée                      |

La Production possède plusieurs branches de répétition ou sauvegarde manuelles,
dont certaines sont archivées. Leur existence ne prouve ni une sauvegarde
automatique, ni une rotation à 30 jours, ni un RPO/RTO. Elles ne sont pas
supprimées pendant cet audit.

L'organisation propriétaire utilise l'offre Free et n'impose pas le MFA. La
branche primaire Production n'est pas protégée. Neon documente qu'une
branche protégée ne peut pas être supprimée ou réinitialisée et que ses computes
ne peuvent pas être supprimés. Cette fonction est disponible sur les offres
payantes compatibles : [Protected branches](https://neon.com/docs/guides/protected-branches).

Neon permet une rétention d'historique configurable pouvant aller jusqu'à 30
jours selon l'offre et l'utilise pour la restauration point-in-time :
[Branch restore](https://neon.com/docs/introduction/branch-restore). La valeur
observée de six heures ne satisfait donc pas la politique de sauvegarde Moodday
à 30 jours et doit être corrigée ou complétée par une sauvegarde externe
chiffrée et éprouvée.

## Conditions de sortie

1. Tourner les identifiants Neon concernés par l'incident, avec rôles et mots de
   passe distincts entre Preview et Production.
2. Créer une cible de répétition PostgreSQL 17 dans un projet Preview séparé,
   même région, sans copie de contenu de santé. Charger uniquement le schéma et
   des fixtures synthétiques ou une structure anonymisée approuvée.
3. Appliquer les 24 migrations sur cette cible, puis répéter l'upgrade 12 → 24
   et vérifier un diff Prisma nul. Cette répétition est déjà verte localement
   sous PostgreSQL 17.11 ; elle reste à reproduire dans l'infrastructure Neon.
4. Protéger la branche primaire Production si l'offre le permet. Si ce contrôle
   n'est pas disponible, documenter une mesure compensatoire et son acceptation
   sécurité avant le lancement.
5. Passer sur une offre compatible avec les exigences Production et imposer le
   MFA à tous les administrateurs de l'organisation avant toute rotation de
   secrets ou migration finale.
6. Porter la rétention PITR à 30 jours ou mettre en place une sauvegarde externe
   chiffrée, isolée et automatiquement expirée sous 30 jours.
7. Provisionner dans Vercel une URL runtime Neon poolée et une URL directe non
   poolée vers le même endpoint, toutes deux avec TLS, différentes entre
   Preview et Production.
8. Restaurer un point de sauvegarde dans une branche isolée, mesurer le RPO et
   le RTO, comparer migrations, contraintes et volumes sans lire de contenu.
9. Ne nettoyer les anciennes branches qu'après clôture de l'incident et preuve
   de restauration. Cette suppression sera une opération destructive séparée.

## Décision

La région et l'isolation de projet sont confirmées. La gate Neon Production
reste fermée pour la rotation des identifiants, la parité PostgreSQL, la
protection de branche, la rétention, la topologie Prisma et le test de
restauration fournisseur, ainsi que l'offre et le MFA administrateur.
