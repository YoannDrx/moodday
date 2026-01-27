# CLAUDE.md

---

## ⚡ AUTO-START mgrep (à faire automatiquement)

**Dès que tu commences à travailler sur ce projet, lance cette commande en background :**

```bash
mgrep watch --store "moodday" &
```

> Lance cette commande UNE SEULE FOIS au début de la session. Ne la relance pas à chaque question.

---


Guide pour Claude Code sur ce dépôt.

---

## À propos de Moodday

**Moodday** est un template boilerplate Next.js 15 pour démarrer rapidement de nouveaux projets avec une stack moderne et complète.

### Fonctionnalités incluses

- Authentification multi-providers (GitHub, Google, Email)
- Paiements Stripe (abonnements)
- Emails transactionnels (Resend)
- Base de données PostgreSQL (NeonDB + Prisma)

---

## mgrep - Assistant de recherche de code

**mgrep est l'outil principal pour explorer ce codebase.** Il retourne une réponse en langage naturel + les sources pertinentes.

### Store : `moodday`

### Lancer le watch (à faire à chaque ouverture du projet)

```bash
cd ~/Projets/moodday
mgrep watch --store "moodday"
```

> Garde ce terminal ouvert : il surveille les modifications en temps réel.

### Commande de recherche

```bash
mgrep "ta question en langage naturel" --store "moodday" -a -m <nombre>
```

### Paramètres

| Paramètre | Description |
|-----------|-------------|
| `--store "moodday"` | **Obligatoire** - le store indexé du projet |
| `-a`                      | Active la réponse en langage naturel                  |
| `-m <n>`                  | Nombre de résultats du retrieval (minimum 10)         |

### Ajuster `-m` selon la complexité

| Type de requête                         | `-m` recommandé |
| --------------------------------------- | --------------- |
| Question simple (1-2 fichiers)          | 10              |
| Question moyenne (flow, feature)        | 20-30           |
| Question complexe (debug, architecture) | 30-50           |

### Stratégie pour requêtes complexes

Si la requête touche **plusieurs parties du codebase**, lance plusieurs mgrep en parallèle plutôt qu'une seule requête surchargée :

```bash
# Exemple : comprendre le système d'auth complet
mgrep "comment fonctionne l'authentification GitHub côté frontend" --store "moodday" -a -m 20
mgrep "comment le token est géré côté serveur" --store "moodday" -a -m 20
mgrep "comment les sessions sont gérées" --store "moodday" -a -m 20
```

### Règles

- **OBLIGATOIRE** : Utilise mgrep pour TOUTE recherche de code. N'utilise JAMAIS grep, Grep tool, ou Glob pour chercher du code.
- **Langage naturel** : mgrep est un agent IA comme toi. Parle-lui comme à un collègue, pas comme à un moteur de recherche.
  - ❌ `"architecture block icon color complete status"` (mots-clés robotiques)
  - ✅ `"Quelle est la couleur de l'icône des blocs d'architecture quand ils sont complétés ?"` (question naturelle)

---

## Subagents (Task tool)

**Les subagents n'héritent PAS des instructions de ce fichier.**

Quand tu lances un subagent Explore, copie-colle les instructions sur mgrep de ce CLAUDE.md dans le prompt du subagent.

---

## Commandes de développement

### Commandes principales

- `pnpm dev` - Serveur de développement (Turbopack)
- `pnpm build` - Compilation production
- `pnpm start` - Serveur production
- `pnpm ts` - Vérification TypeScript
- `pnpm lint` - ESLint avec auto-fix
- `pnpm clean` - Lint + TypeCheck + Format
- `pnpm format` - Formatage Prettier

### Setup et diagnostic

- `pnpm init-project` - Initialiser un nouveau projet (première fois)
- `pnpm setup` - Configuration interactive des services cloud
- `pnpm doctor` - Diagnostic de santé du projet

### Base de données

- `pnpm prisma:migrate` - Créer une migration
- `pnpm prisma:seed` - Seeder la base
- `pnpm prisma:generate` - Regénérer le client Prisma
- `pnpm better-auth:migrate` - Générer le schema Better Auth

### Tests

- `pnpm test:ci` - Tests unitaires (Vitest)
- `pnpm test:e2e:ci` - Tests E2E headless (Playwright)
- `pnpm test:e2e` - Tests E2E avec UI

### Outils de dev

- `pnpm email` - Serveur de développement emails
- `pnpm stripe-webhooks` - Écouter les webhooks Stripe
- `pnpm knip` - Détection de code inutilisé
- `pnpm mgrep` - Lancer le watcher mgrep (synchronisation du code)

---

## CLIs requis

Le projet utilise plusieurs CLIs pour automatiser le setup et le déploiement.

### Installation

```bash
npm i -g @vercel/cli neonctl @upstash/cli stripe gh @mixedbread/mgrep
```

### Liste des CLIs

| CLI       | Package            | Commande login       | Usage                       |
| --------- | ------------------ | -------------------- | --------------------------- |
| `gh`      | `gh`               | `gh auth login`      | GitHub                      |
| `vercel`  | `@vercel/cli`      | `vercel login`       | Déploiement                 |
| `neon`    | `neonctl`          | `neon auth`          | PostgreSQL (NeonDB)         |
| `upstash` | `@upstash/cli`     | `upstash auth login` | Redis (Upstash)             |
| `stripe`  | `stripe`           | `stripe login`       | Paiements (optionnel)       |
| `mgrep`   | `@mixedbread/mgrep`| `mgrep login`        | Recherche de code IA        |

---

## Architecture

### Stack technique

- **Framework** : Next.js 16 avec App Router
- **Langage** : TypeScript (mode strict)
- **Styling** : TailwindCSS v4 avec Shadcn/UI
- **Base de données** : PostgreSQL avec Prisma ORM
- **Authentification** : Better Auth
- **Emails** : React Email avec Resend
- **Paiements** : Stripe
- **Tests** : Vitest (unitaires), Playwright (E2E)
- **Package Manager** : pnpm

### Structure du projet

- `app/` - Pages et layouts Next.js App Router
- `src/components/` - Composants UI (Shadcn/UI dans `ui/`, custom dans `nowts/`)
- `src/features/` - Composants et logique par feature
- `src/lib/` - Utilitaires, configurations et services
- `src/hooks/` - Hooks React personnalisés
- `emails/` - Templates emails (React Email)
- `prisma/` - Schema et migrations
- `scripts/` - Scripts de setup et diagnostic
- `e2e/` - Tests end-to-end
- `__tests__/` - Tests unitaires

---

## Conventions de code

### TypeScript

- Utiliser `type` plutôt que `interface` (enforced par ESLint)
- Composants fonctionnels avec types TypeScript
- Pas d'enums - utiliser des maps
- Configuration TypeScript stricte
- Préférer `??` à `||`

### React/Next.js

- Préférer les React Server Components aux client components
- Utiliser `"use client"` uniquement pour l'accès aux Web APIs dans de petits composants
- Wrapper les client components dans `Suspense` avec fallback
- Utiliser le chargement dynamique pour les composants non critiques

### Styling

- Approche mobile-first avec TailwindCSS
- Utiliser les composants Shadcn/UI de `src/components/ui/`
- Composants custom dans `src/components/nowts/`
- Utiliser les composants de typographie de `@/components/ui/typography.tsx`
- Préférer `flex flex-col gap-4` pour l'espacement vertical (pas `space-y-4`)
- Préférer le composant Card pour les wrappers stylisés

---

## Gestion d'état

- `nuqs` pour l'état des paramètres URL
- `Zustand` pour l'état global (voir dialog-store.ts)
- `TanStack Query` pour l'état serveur

---

## Formulaires et Server Actions

- Utiliser React Hook Form avec validation Zod
- Server actions dans les fichiers `.action.ts`
- Utiliser le helper `resolveActionResult` pour les mutations
- Suivre le pattern de création de formulaires dans `/src/features/form/`
- Toutes les Server Actions DOIVENT utiliser `@/lib/actions/safe-actions.ts`

---

## Authentification

- Utiliser `getUser()` pour un utilisateur optionnel (côté serveur)
- Utiliser `getRequiredUser()` pour un utilisateur requis (côté serveur)
- Utiliser `useSession()` depuis auth-client.ts (côté client)

---

## Base de données

- Prisma ORM avec PostgreSQL
- Hooks de base de données pour la configuration à la création d'utilisateur

---

## Système de Dialog

- Utiliser `dialogManager` pour les modals globales
- Types : confirm, input, custom dialogs
- États de chargement et gestion d'erreurs automatiques

---

## API Routes

- Toutes les routes API DOIVENT utiliser `@/lib/zod-route.ts`
- Toujours lire `zod-route.ts` avant de créer des routes
- Toutes les requêtes API DOIVENT utiliser `@/lib/up-fetch.ts` (jamais `fetch` directement)

---

## Tests

### Tests unitaires

- Situés dans `__tests__/`
- Utiliser Vitest avec React Testing Library
- Mock extended avec `vitest-mock-extended`

### Tests E2E

- Situés dans `e2e/`
- Utiliser Playwright avec les utilitaires de test custom
- Fonctions helper dans `e2e/utils/`

---

## Fichiers importants

- `src/lib/auth.ts` - Configuration authentification
- `src/features/dialog-manager/` - Système de dialog global
- `src/lib/actions/actions-utils.ts` - Utilitaires server actions
- `src/lib/actions/safe-actions.ts` - Logique safe actions
- `src/lib/zod-route.ts` - Logique routes API
- `src/lib/up-fetch.ts` - Client fetch amélioré
- `src/components/ui/form.tsx` - Composants formulaires
- `prisma/schema.prisma` - Schema base de données
- `src/site-config.ts` - Configuration du site

---

## Nommage des fichiers

- Server actions : suffixe `.action.ts` (ex: `user.action.ts`, `dashboard.action.ts`)

---

## Imports TypeScript

Toujours utiliser les paths TypeScript :

- `@/*` → `src/`
- `@email/*` → `emails/`
- `@app/*` → `app/`

---

## Debugging et tâches complexes

Pour les logiques complexes et le debugging, utilise des logs. Ajoute beaucoup de logs à chaque étape et DEMANDE-MOI DE T'ENVOYER les logs pour debugger facilement.

---

## Workflow de modification

🚨 **RÈGLE CRITIQUE - TOUJOURS SUIVRE** 🚨

**AVANT de modifier des fichiers, tu DOIS lire au moins 3 fichiers** qui t'aideront à comprendre comment rendre le code cohérent et consistant.

C'est **NON-NÉGOCIABLE**. Ne saute jamais cette étape. Lire les fichiers existants assure :

- Cohérence du code avec les patterns du projet
- Bonne compréhension des conventions
- Respect de l'architecture établie
- Évitement des breaking changes

**Types de fichiers à lire :**

1. **Fichiers similaires** : Lis des fichiers avec des fonctionnalités similaires pour comprendre les patterns
2. **Dépendances importées** : Lis les définitions/implémentations des imports dont tu n'es pas 100% sûr de l'utilisation

**Étapes à suivre :**

1. Lire au moins 3 fichiers pertinents (fonctionnalités similaires + dépendances)
2. Comprendre les patterns, conventions et utilisation des APIs
3. Ensuite seulement procéder à la création/modification des fichiers

---

## BMAD-METHOD (optionnel)

BMAD (Breakthrough Method for Agile AI Driven Development) est un framework d'agents IA spécialisés pour le développement agile. Il peut être installé via `pnpm setup`.

### Commande rapide

- `/bmad` - Guide d'utilisation complet

### Installation manuelle

```bash
npx bmad-method@alpha install
# Sélectionner "Claude Code" comme IDE
```

### Workflow recommandé

1. `*workflow-init` - Initialiser un nouveau projet
2. `*prd` - Créer le Product Requirements Document
3. `*create-architecture` - Designer l'architecture
4. `*create-epics-and-stories` - Générer les stories
5. `*dev-story` - Implémenter

### Agents disponibles

| Agent          | Rôle                   |
| -------------- | ---------------------- |
| `/analyst`     | Analyse et recherche   |
| `/pm`          | Product Management     |
| `/architect`   | Architecture technique |
| `/ux-designer` | Design UX/UI           |
| `/sm`          | Scrum Master           |
| `/dev`         | Développement          |
| `/tea`         | Test Architect         |

### Structure

- `_bmad/` - Configuration et agents (à committer)
- `_bmad-output/` - Artifacts générés (gitignored)
