# Mood Day

Mood Day est un compagnon de continuité de soin web et mobile, confidentiel et
non médical. La V2 aide à garder le fil entre les journées et les rendez-vous,
avec une promesse simple : **« Moins saisir. Mieux comprendre. Mieux se
préparer. »** Elle n'établit aucun diagnostic et ne formule aucune recommandation
thérapeutique.

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env-template .env.local
pnpm env:audit
```

### 3. Start developing

```bash
pnpm dev
```

Pour l'application native, un development build est requis :

```bash
pnpm mobile:ios
# ou
pnpm mobile:android
```

Puis, pour relancer Metro avec le development client déjà installé :

```bash
pnpm dev:mobile
```

Le dépôt est maintenant un workspace pnpm. L'application Next.js reste
temporairement à la racine afin de conserver le pipeline de production V1
pendant la migration ; Expo vit dans `apps/mobile` et les contrats partagés dans
`packages/*`. Le déplacement mécanique du web vers `apps/web` est une étape de
stabilisation distincte, après validation des pipelines de preview.

## Périmètre fonctionnel

Le cœur utilisable sans service sensible comprend :

- journal d'humeur, sommeil, énergie et anxiété, avec historique et filtres ;
- traitements déclarés, prises, PRN, historique de dosage et adhérence descriptive ;
- notes de thérapie, exercices et préparation de consultation ;
- plan de sécurité personnel, ressources de crise françaises et exports ;
- PWA, file hors ligne cloisonnée par compte et synchronisation avec gestion des conflits ;
- authentification par e-mail, préférences de confidentialité et interface FR/EN ;
- PostgreSQL avec Prisma et limitation de débit atomique, sans Redis ni Upstash.

Les modules sensibles sont implémentés mais restent désactivés par défaut et
échouent de façon fermée tant que leurs portes de production ne sont pas
validées : facturation Stripe, insights IA, cercle aidant, notifications push,
import de données, fournisseurs OAuth et administration. Les associations
statistiques affichées par le produit sont descriptives : Moodday n'en déduit
ni causalité, ni diagnostic, ni recommandation médicale.

L'état détaillé des validations techniques et externes est consigné dans
`docs/operations/production-release-gates.md`. Une fonctionnalité ne doit pas
être annoncée comme disponible sur la seule base de sa présence dans le code.

## Commands

| Command                 | Description                            |
| ----------------------- | -------------------------------------- |
| `pnpm dev`              | Start development server               |
| `pnpm dev:mobile`       | Start Expo for a development build     |
| `pnpm mobile:ios`       | Build and run the native iOS app       |
| `pnpm mobile:android`   | Build and run the native Android app   |
| `pnpm typecheck:mobile` | Type-check the Expo application        |
| `pnpm env:audit`        | Validate local environment conventions |
| `pnpm doctor`           | Check project health                   |
| `pnpm verify`           | Run the complete local quality gate    |
| `pnpm build`            | Build for production                   |
| `pnpm test:ci`          | Run unit tests                         |
| `pnpm test:e2e:ci`      | Run E2E tests                          |

## Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS v4 with Shadcn/UI
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Better Auth
- **Payments**: Stripe
- **Emails**: React Email + Resend

## Documentation

- `docs/operations/production-release-gates.md` : source de vérité des portes de production.
- `docs/v2/implementation-status.md` : architecture V2 livrée, décisions de migration et prochaines gates.
- `docs/operations/production-release-runbook.md` : maintenance, migration, activation et rollback.
- `docs/operations/completion-audit-2026-08-14.md` : audit phase par phase et preuves restantes.
- `docs/design-system.md` : identité et règles UI/UX.
- `docs/data-lifecycle.md` : contenu des exports, fichiers et règles de purge.
- `docs/migrations/` : historique et procédures de migration.
- `PROJECT_STATUS.md` : audit fonctionnel détaillé.

## License

MIT
