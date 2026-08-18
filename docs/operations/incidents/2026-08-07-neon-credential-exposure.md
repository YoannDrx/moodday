# Incident 2026-08-07 — secret de connexion Neon

Statut : contenu et remédié le 2026-08-07. Aucun contenu utilisateur consulté.

## Résumé

Pendant la répétition d'une migration, une commande de diagnostic a rendu une
chaîne de connexion d'une branche Neon temporaire dans une sortie d'outil. Le
mot de passe du rôle était alors partagé avec la branche principale. Une
première commande de migration avait aussi ciblé la branche principale au lieu
du clone, car la cible retournée par la CLI n'avait pas été vérifiée par son
hôte avant exécution.

## Impact observé

- Secret de base potentiellement exposé dans la sortie technique de la tâche.
- Dix entrées de migration ont été enregistrées en production et trois
  migrations additives ont été appliquées.
- Le contrôle agrégé des abonnements n'a trouvé aucun abonnement Plus actif ni
  ancien plan Pro/Ultra ; aucune donnée de contenu n'a été lue.
- Aucun changement destructif de colonne ou de table n'a été exécuté.

## Remédiation

1. Rotation immédiate du mot de passe du rôle principal.
2. Synchronisation des deux URL Prisma locales et des variables Vercel ciblées,
   sans afficher leur valeur.
3. Redéploiement du dernier artefact de production connu, afin de charger le
   nouveau secret sans publier les changements de cette branche.
4. Preuve de connexion via `SELECT 1` et `prisma migrate status`.
5. Répétition de la baseline et des trois migrations sur un clone isolé ; diff
   de schéma vide avec le parent.
6. Suppression de la branche temporaire et du rôle de diagnostic inutilisé.

## Prévention

- Vérifier et comparer les hôtes avant toute commande de migration.
- Passer simultanément `DATABASE_URL` et `DATABASE_URL_UNPOOLED`.
- Ne jamais demander une chaîne de connexion en sortie JSON/texte dans un
  terminal partagé ; capturer la valeur sans l'imprimer.
- Utiliser le runbook `docs/operations/prisma-baseline.md` et interrompre si la
  cible ne peut pas être prouvée.
