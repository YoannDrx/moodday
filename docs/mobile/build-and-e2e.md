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
6. configurer les credentials Apple et Google dans les coffres EAS, jamais dans Git ;
7. enregistrer les identifiants et deep links des trois variantes dans Better Auth, Apple et Google.

`EXPO_PUBLIC_API_URL` est incorporée dans le bundle et n’est donc pas un secret. Preview et production refusent de construire si elle manque ou si elle n’utilise pas HTTPS. Toutes les clés privées restent exclusivement côté serveur ou dans les coffres du fournisseur.

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
- collecte HealthKit/Health Connect, notifications et achats encore désactivés tant que leurs lots dédiés ne sont pas validés.

Références : [profils EAS](https://docs.expo.dev/build/eas-json/), [variables d’environnement EAS](https://docs.expo.dev/eas/environment-variables/), [tests Maestro dans EAS Workflows](https://docs.expo.dev/eas/workflows/examples/e2e-tests/).
