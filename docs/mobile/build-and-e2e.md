# Builds mobiles et tests E2E

Ce document décrit le socle de livraison d’Expo/EAS. Il ne vaut pas autorisation de publier une app ni de traiter des données réelles avant la fermeture des gates produit, sécurité, juridique et HDS.

## Variantes

| Variante    | Nom installé     | Identifiant iOS/Android    | Deep link            | Environnement EAS |
| ----------- | ---------------- | -------------------------- | -------------------- | ----------------- |
| Development | Mood Day Dev     | `fr.yodev.moodday.dev`     | `moodday-dev://`     | `development`     |
| Preview     | Mood Day Preview | `fr.yodev.moodday.preview` | `moodday-preview://` | `preview`         |
| Production  | Mood Day         | `fr.yodev.moodday`         | `moodday://`         | `production`      |

Les trois applications peuvent donc cohabiter sur un appareil. Les liens d’authentification doivent être enregistrés séparément chez chaque fournisseur.

## Configuration EAS à terminer une fois

Depuis `apps/mobile` :

1. installer l’outil hors du graphe applicatif avec `npm install --global eas-cli@22.2.0` ;
2. se connecter au compte Expo de l’organisation avec `eas login` ;
3. exécuter `eas init` pour lier le projet et ajouter l’`owner` et le `projectId` générés ;
4. relier le dépôt GitHub dans EAS Workflows ;
5. créer `EXPO_PUBLIC_API_URL` dans chacun des trois environnements EAS ;
6. créer `EXPO_PUBLIC_REVENUECAT_ENABLED` et
   `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` dans chaque environnement iOS ;
7. configurer les credentials Apple dans le coffre EAS, jamais dans Git ;
8. enregistrer les identifiants et deep links des trois variantes dans Better
   Auth, Apple et Google OAuth ;
9. ne créer la clé RevenueCat Android et les credentials Google Play qu'au
   démarrage du lot Android, sans bloquer la release iOS.

`EXPO_PUBLIC_API_URL` est incorporée dans le bundle et n’est donc pas un secret. Preview et production refusent de construire si elle manque ou si elle n’utilise pas HTTPS. Toutes les clés privées restent exclusivement côté serveur ou dans les coffres du fournisseur.

Les clés publiques RevenueCat sont elles aussi incorporées dans le bundle. Elles
doivent être distinctes par plateforme et pointer vers les apps RevenueCat de la
bonne variante. Pour la release iOS, dès que
`EXPO_PUBLIC_REVENUECAT_ENABLED=true`, la configuration refuse un build
Preview/Production auquel manque la clé iOS. La clé Android reste facultative
jusqu'au lot Google Play.

## Abonnements mobiles

La configuration commerciale attendue est la suivante :

- entitlement RevenueCat : `plus` ;
- offering courant avec packages mensuel et annuel ;
- produits App Store Connect reliés à ce même entitlement pour la première
  release ; Google Play est reporté ;
- App User ID égal à l’identifiant interne Better Auth, jamais l’adresse e-mail ;
- webhook Preview filtré `SANDBOX`, webhook Production filtré `PRODUCTION` ;
- URL : `/api/webhooks/revenuecat` ;
- Authorization : `Bearer <REVENUECAT_WEBHOOK_AUTH_TOKEN>` ;
- signature HMAC activée, secret stocké dans
  `REVENUECAT_WEBHOOK_SIGNING_SECRET` ;
- clé REST secrète stockée uniquement dans `REVENUECAT_SECRET_API_KEY` ;
- identifiants de produits allowlistés dans `REVENUECAT_PLUS_PRODUCT_IDS` et
  identifiants d’apps allowlistés dans `REVENUECAT_ALLOWED_APP_IDS`.

Après achat ou restauration, l’app demande au serveur de relire le client
RevenueCat. Le webhook est revendiqué durablement, traité après la réponse et
repris par `/api/cron/revenuecat-webhooks` en cas d’interruption. PostgreSQL
projette ensuite le même droit vers le web et le mobile. Deux sources actives
restent actives mais déclenchent un avertissement ; Mood Day n’annule jamais un
abonnement à la place de l’utilisateur.

Le CLI EAS n’est pas une dépendance de l’application : son graphe d’outillage reste séparé de la chaîne installée en production. `eas.json` impose néanmoins exactement la version `22.2.0` pour éviter une exécution avec un CLI différent.

Au 23 août 2026, le plan RevenueCat Pro commence à 0 USD jusqu'à 2 500 USD de
Monthly Tracked Revenue, puis coûte 1 %. Les intégrations Pro, dont les webhooks,
sont donc disponibles pendant cette tranche gratuite. Mood Day conserve
RevenueCat et ouvre une revue financière interne à 2 000 USD de MTR ; cette
revue n'est pas présentée comme une alerte native RevenueCat. La tarification et
les fonctionnalités seront revérifiées avant l'activation commerciale puis à
chaque revue, depuis la [page tarifaire RevenueCat](https://www.revenuecat.com/pricing/)
et la [documentation des webhooks](https://www.revenuecat.com/docs/integrations/webhooks).

Exemple de valeurs attendues :

- development : URL HTTPS du tunnel de développement ou `http://localhost:3000` sur simulateur ;
- preview : backend de preview stable et isolé ;
- production : `https://www.moodday.app`.

## Commandes

À la racine du dépôt :

```bash
pnpm typecheck:mobile
pnpm mobile:build:preview
pnpm mobile:build:production          # iOS uniquement
pnpm mobile:build:production:android  # reporté au lot Android
pnpm mobile:e2e:ios
pnpm mobile:e2e:android               # non bloquant pour la release iOS
```

Les workflows E2E sont uniquement manuels. Ce choix évite une consommation EAS à chaque pull request tant que le budget et le quota n’ont pas été validés. Ils construisent une app installable sans credentials de store, puis exécutent le smoke test Maestro de connexion.

Pour un test local, installer Maestro et un build Preview dans le simulateur/émulateur, puis lancer :

```bash
pnpm mobile:maestro
```

## Gates avant le premier build distribué

- projet Expo rattaché au compte d’organisation et accès de secours vérifié ;
- environnements EAS isolés, URL d’API vérifiées et aucune valeur de santé dans les logs ;
- credentials Apple créés au nom de l’organisation ; les credentials Google
  Play sont explicitement reportés ;
- callbacks Better Auth testés sur chaque scheme ;
- politique de coûts EAS approuvée avant automatisation des builds ;
- smoke Maestro vert sur iOS ; la matrice Android sera rejouée avant sa propre
  release ;
- collecte HealthKit désactivée tant que la recette sur iPhone réel, le contrôle
  des permissions fines et l'inspection réseau n'ont pas été validés ; Health
  Connect est reporté au lot Android ;
- achats sandbox validés sur un appareil réel, restauration et remboursement
  propagés au web, puis produits de production approuvés dans App Store
  Connect ;
- tarification RevenueCat et disponibilité des webhooks revérifiées et preuve
  datée conservée avant activation commerciale.

## Santé et calendrier natif iOS

- HealthKit utilise un development build, jamais Expo Go ; les permissions sont
  demandées métrique par métrique depuis l'écran Connexions Santé.
- Les échantillons bruts restent dans SQLCipher. Le serveur n'accepte que les
  agrégats journaliers validés, leur provenance, leur qualité et la version de
  calcul ; une absence de mesure ne produit pas un zéro.
- Le sommeil est attribué au jour local de réveil afin de ne pas perdre une nuit
  commencée avant minuit.
- L'utilisateur peut suspendre la source ou supprimer une période et la copie
  locale correspondante. Une révocation définitive supprime les agrégats
  synchronisés.
- Le calendrier iPhone n'est lu qu'après une action explicite. L'import liste au
  maximum cent événements horaires des 120 prochains jours et ne copie que le
  titre, l'horaire et le lieu de l'événement choisi.
- Le plan de sécurité personnel est mis en cache dans SQLCipher, reste accessible
  hors ligne et n'entre jamais dans Cercle ou dans un brief de consultation.

Références : [profils EAS](https://docs.expo.dev/build/eas-json/), [variables d’environnement EAS](https://docs.expo.dev/eas/environment-variables/), [tests Maestro dans EAS Workflows](https://docs.expo.dev/eas/workflows/examples/e2e-tests/).
