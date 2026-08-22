# Cycle de vie des données Moodday

Moodday est un journal personnel non médical. Les données de suivi restent
privées par défaut et ne doivent jamais être copiées dans les analytics, les
logs techniques ou les outils de support.

## Export utilisateur

Le téléchargement JSON version 2.2 contient :

- profil et préférences ;
- humeurs, traitements, prises, historiques de dosage, planning et stock ;
- séances de thérapie et exercices ;
- consentements, tags, préparations de consultation et plan de sécurité ;
- relations aidant, observations, événements et journal d'accès sans contenu.

Il exclut les sessions et identifiants d'authentification, secrets push,
identifiants Stripe, tokens d'invitation et identifiants d'opérations hors
ligne. Le téléchargement est servi par `/api/export/json` avec authentification,
`Cache-Control: private, no-store` et une réponse JSON progressive. Les PDF et
CSV de consultation restent limités à la période choisie.

## Export réglementaire séparé

L'export produit respecte exactement les visibilités du service. Une demande
réglementaire validée humainement suit une procédure distincte : elle inclut
les contributions aidant cachées ou archivées concernant la personne, exclut
les secrets d'authentification, puis produit une enveloppe AES-256-GCM. Le mode
de revue écrit cette enveloppe dans un répertoire opérationnel ignoré par Git ;
le mode de remise la publie dans un Blob privé et ne laisse localement qu'un
fichier de passation `0600`. PostgreSQL ne conserve qu'un audit sans contenu,
le digest HMAC du token à usage unique, une empreinte et des dates. Le token est
effacé lors de sa consommation, le Blob est programmé pour suppression sous 15
minutes après téléchargement ou au plus tard à l'expiration de 24 heures. La
clé AES reste transmise par un canal distinct et doit également être détruite.

## Fichiers

Le seul fichier utilisateur géré par l'application est actuellement l'avatar.
Les nouveaux fichiers sont stockés sous `profile-images/<userId>/` dans Vercel
Blob. L'upload rattache immédiatement l'URL au compte ; le remplacement supprime
l'ancien Blob et restaure la référence précédente si cette purge échoue.

Les URL externes issues d'un fournisseur OAuth ne sont jamais envoyées à l'API
de suppression Blob. Lors de la suppression du compte, la transaction crée un
job externe détaché puis supprime les lignes du compte. Ce job conserve une
référence HMAC et le localisateur Blob, sans relation utilisateur, jusqu'à la
suppression externe ou sa dead letter. Les exports réglementaires temporaires
ne sont jamais stockés en clair.

## Rétention et suppression

- Les données actives sont conservées tant que le compte existe.
- La révocation d'un aidant archive la relation comme `revoked`, invalide son
  invitation et coupe immédiatement ses lectures et écritures. La relation et
  son journal restent accessibles au patient selon la politique de rétention.
- La suppression de l'un des comptes concernés purge ses lignes de journal
  d'accès par cascade.
- La suppression du compte purge les données sans cascade explicite, les
  données métier en cascade, l'avatar géré et les références d'authentification.
- Les enveloppes réglementaires privées sont détachées du compte par conception :
  un job externe sans relation utilisateur garantit que leur purge survit à la
  suppression du compte.
- Les délais de disparition dans les sauvegardes du fournisseur doivent rester
  alignés avec la politique de confidentialité publiée.
- Les opérations et snapshots chiffrés conservés localement dans le navigateur
  sont purgés après synchronisation, purge explicite ou au plus tard après 30
  jours. Toute entrée sans horodatage de rétention fiable est également purgée.
- Sur mobile, chaque compte utilise une base SQLCipher séparée et une clé
  SecureStore propre à l'appareil. Le nom de fichier contient une empreinte
  SHA-256 tronquée, jamais l'identifiant utilisateur brut. Une mutation est
  chiffrée localement avant son envoi et supprimée de la file après acquittement
  serveur. La disparition ou le remplacement de la session ferme immédiatement
  la base du compte précédent sans supprimer sa file. Une déconnexion ordinaire
  est bloquée tant qu'une opération est en attente, en conflit ou rejetée :
  l'utilisateur peut synchroniser ou confirmer séparément la suppression de la
  base locale et de sa clé. Cette purge locale déconnecte l'appareil mais ne
  supprime ni le compte ni les données déjà synchronisées. La propagation de la
  suppression complète du compte vers chaque appareil reste une gate de bêta.
- Le job technique quotidien applique, sous réserve d'approbation juridique,
  90 jours aux traces de livraison e-mail et push terminées, 12 mois aux accès
  aidant et usages IA sans contenu, 13 mois aux événements webhook Stripe et 30
  jours aux jobs terminés et reçus d'idempotence médicamenteux.
