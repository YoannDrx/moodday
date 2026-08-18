# Export réglementaire contrôlé (DSAR)

Statut : **parcours technique privé disponible, validation DPO et preuve fournisseur Production à obtenir**

Cette procédure est séparée de l'export produit. Elle inclut les contributions
aidant cachées ou révoquées lorsqu'elles concernent la personne, tout en
excluant les secrets d'authentification. Aucun écran admin ne permet de
parcourir le contenu.

## Autorisations préalables obligatoires

Deux personnes distinctes doivent consigner hors de Moodday :

1. la demande et son identifiant interne ;
2. la preuve d'identité du demandeur ;
3. le périmètre et les éventuelles restrictions juridiquement justifiées ;
4. l'identifiant du relecteur qui autorise la génération ;
5. le canal de remise et l'échéance de suppression.

La commande refuse de démarrer sans l'acquittement explicite
`DSAR_EXPORT_ACK=identity-and-scope-approved`. Cet acquittement ne remplace pas
le contrôle humain.

## Génération et revue locale

Utiliser une machine d'exploitation contrôlée, une connexion Production en
lecture autorisée et une clé AES dédiée de 32 octets encodée en base64 :

```sh
DSAR_EXPORT_ACK=identity-and-scope-approved \
DSAR_EXPORT_ENCRYPTION_KEY='<clé-base64-dédiée>' \
pnpm dsar:generate -- \
  --user-id '<identifiant-interne>' \
  --request-id '<référence-demande>' \
  --reviewer-id '<référence-relecteur>'
```

Sans l'option de publication, le résultat est écrit une seule fois avec des
permissions `0600` dans `artifacts/dsar/`, répertoire ignoré par Git. Le fichier
ne contient qu'une enveloppe AES-256-GCM. PostgreSQL conserve exclusivement des
références HMAC, le statut, l'empreinte SHA-256 et les dates ; aucun contenu,
chemin ou identifiant utilisateur brut n'est journalisé.

Ce mode local sert uniquement à la revue humaine contrôlée. Après validation
du périmètre, relancer avec un nouvel identifiant de demande et la livraison
privée :

```sh
DSAR_EXPORT_ACK=identity-and-scope-approved \
DSAR_EXPORT_ENCRYPTION_KEY='<clé-base64-dédiée>' \
DSAR_DOWNLOAD_BASE_URL='https://moodday.app' \
BLOB_READ_WRITE_TOKEN='<jeton-blob-production>' \
pnpm dsar:generate -- \
  --user-id '<identifiant-interne>' \
  --request-id '<nouvelle-référence-demande>' \
  --reviewer-id '<référence-relecteur>' \
  --publish-private
```

Le mode privé place exclusivement l'enveloppe chiffrée dans Vercel Blob avec
`access=private`. Il crée dans `artifacts/dsar/` un fichier de passation
`*.handoff.json` en permissions `0600`. Ce fichier contient le lien à usage
unique et son échéance, jamais la clé AES. Le token du lien n'est conservé en
base que sous forme de digest HMAC ; il n'apparaît ni dans stdout ni dans les
logs.

## Contrôle et remise

- Comparer l'empreinte affichée avec `artifactDigest` dans
  `regulatory_export_audit`.
- Déchiffrer uniquement dans un environnement de revue éphémère.
- Faire valider le périmètre par la personne habilitée avant la remise.
- Transmettre le lien privé du fichier de passation par le canal approuvé et la
  clé AES par un canal distinct.
- Ne jamais joindre le fichier en clair à un e-mail ou un ticket support.
- Supprimer le fichier de passation local dès la remise.
- Après ouverture, le token est invalidé transactionnellement avant la réponse
  et le Blob est remis dans la file de purge avec un délai maximal de 15 minutes.
- Sans ouverture, le lien expire sous 24 heures ; la rétention marque l'audit
  expiré et le job externe purge le Blob.
- Supprimer la copie de revue et la clé au plus tard à l'expiration.

La page enlève le fragment secret de l'URL avant toute action, ne l'affiche
jamais et l'envoie uniquement dans le corps d'un `POST`. L'API est désactivée
en maintenance et renvoie des erreurs publiques génériques. Les tests unitaires,
PostgreSQL et les cinq profils Playwright couvrent l'usage unique et le
téléchargement. La création et la purge réelles du Blob doivent encore être
éprouvées sur le compte fournisseur Production avant de cocher la gate DSAR.
Cette preuve technique ne remplace jamais l'autorisation DPO.

## Contenu délibérément exclu

- hash de mot de passe, jetons de session, OAuth et réinitialisation ;
- secret TOTP et codes de récupération ;
- clé publique et identifiant de credential passkey ;
- endpoint et clés Web Push ;
- jeton d'invitation aidant.

Les métadonnées d'activité utiles au droit d'accès restent incluses : dates de
session, appareil approximatif, fournisseur connecté, consentements, accès
aidant, historiques de traitement, traces IA sans contenu et états de
livraison.
