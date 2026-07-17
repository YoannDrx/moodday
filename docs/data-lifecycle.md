# Cycle de vie des données Moodday

Moodday est un journal personnel non médical. Les données de suivi restent
privées par défaut et ne doivent jamais être copiées dans les analytics, les
logs techniques ou les outils de support.

## Export utilisateur

Le téléchargement JSON version 2.1 contient :

- profil et préférences ;
- humeurs, traitements, prises et historique de dosage ;
- séances de thérapie et exercices ;
- relations aidant, observations, événements et journal d'accès sans contenu.

Il exclut les sessions et identifiants d'authentification, secrets push,
identifiants Stripe, tokens d'invitation et identifiants d'opérations hors
ligne. Le téléchargement est servi par `/api/export/json` avec authentification,
`Cache-Control: private, no-store` et une réponse JSON progressive. Les PDF et
CSV de consultation restent limités à la période choisie.

## Fichiers

Le seul fichier utilisateur géré par l'application est actuellement l'avatar.
Les nouveaux fichiers sont stockés sous `profile-images/<userId>/` dans Vercel
Blob. L'upload rattache immédiatement l'URL au compte ; le remplacement supprime
l'ancien Blob et restaure la référence précédente si cette purge échoue.

Les URL externes issues d'un fournisseur OAuth ne sont jamais envoyées à l'API
de suppression Blob. Lors de la suppression du compte, un avatar Moodday géré
est supprimé avant les lignes PostgreSQL. Aucun export temporaire n'est stocké
côté serveur.

## Rétention et suppression

- Les données actives sont conservées tant que le compte existe.
- La révocation d'un aidant supprime la relation mais conserve le journal
  d'accès visible par le patient.
- La suppression de l'un des comptes concernés purge ses lignes de journal
  d'accès par cascade.
- La suppression du compte purge les données sans cascade explicite, les
  données métier en cascade, l'avatar géré et les références d'authentification.
- Les délais de disparition dans les sauvegardes du fournisseur doivent rester
  alignés avec la politique de confidentialité publiée.
