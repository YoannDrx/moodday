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
6. créer `EXPO_PUBLIC_REVENUECAT_ENABLED`, `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
   et `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` dans chaque environnement ;
7. configurer les credentials Apple et Google dans les coffres EAS, jamais dans Git ;
8. enregistrer les identifiants et deep links des trois variantes dans Better Auth, Apple et Google.

`EXPO_PUBLIC_API_URL` est incorporée dans le bundle et n’est donc pas un secret. Preview et production refusent de construire si elle manque ou si elle n’utilise pas HTTPS. Toutes les clés privées restent exclusivement côté serveur ou dans les coffres du fournisseur.

Les clés publiques RevenueCat sont elles aussi incorporées dans le bundle. Elles
doivent être distinctes par plateforme et pointer vers les apps RevenueCat de la
bonne variante. Dès que `EXPO_PUBLIC_REVENUECAT_ENABLED=true`, la configuration
refuse un build Preview/Production auquel il manque l’une des deux clés.

## Abonnements mobiles

La configuration commerciale attendue est la suivante :

- entitlement RevenueCat : `plus` ;
- offering courant avec packages mensuel et annuel ;
- produits App Store Connect et Google Play reliés à ce même entitlement ;
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

Exemple de valeurs attendues :

- development : URL HTTPS du tunnel de développement ou `http://localhost:3000` sur simulateur ;
- preview : backend de preview stable et isolé ;
- production : `https://www.moodday.app`.

## Commandes

À la racine du dépôt :

```bash
pnpm typecheck:mobile
pnpm mobile:build:preview
pnpm mobile:build:production
pnpm mobile:e2e:ios
pnpm mobile:e2e:android
```

Les workflows E2E sont uniquement manuels. Ce choix évite une consommation EAS à chaque pull request tant que le budget et le quota n’ont pas été validés. Ils construisent une app installable sans credentials de store, puis exécutent le smoke test Maestro de connexion.

Pour un test local, installer Maestro et un build Preview dans le simulateur/émulateur, puis lancer :

```bash
pnpm mobile:maestro
```

## Gates avant le premier build distribué

- projet Expo rattaché au compte d’organisation et accès de secours vérifié ;
- environnements EAS isolés, URL d’API vérifiées et aucune valeur de santé dans les logs ;
- credentials Apple/Google créés au nom de l’organisation ;
- callbacks Better Auth testés sur chaque scheme ;
- politique de coûts EAS approuvée avant automatisation des builds ;
- smoke Maestro vert sur iOS et Android ;
- collecte HealthKit/Health Connect et notifications encore désactivées tant que leurs lots dédiés ne sont pas validés ;
- achats sandbox validés sur un appareil réel, restauration et remboursement
  propagés au web, puis produits de production approuvés dans les deux stores ;
- plan RevenueCat incluant les webhooks confirmé avant activation commerciale.

Références : [profils EAS](https://docs.expo.dev/build/eas-json/), [variables d’environnement EAS](https://docs.expo.dev/eas/environment-variables/), [tests Maestro dans EAS Workflows](https://docs.expo.dev/eas/workflows/examples/e2e-tests/).
