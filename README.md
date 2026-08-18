# Moodday

Moodday est un journal personnel PWA de santé mentale, confidentiel et non médical. Il aide à conserver ses propres repères d'humeur, de traitements et de bien-être sans établir de diagnostic ni formuler de recommandation thérapeutique.

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

| Command            | Description                            |
| ------------------ | -------------------------------------- |
| `pnpm dev`         | Start development server               |
| `pnpm env:audit`   | Validate local environment conventions |
| `pnpm doctor`      | Check project health                   |
| `pnpm verify`      | Run the complete local quality gate    |
| `pnpm build`       | Build for production                   |
| `pnpm test:ci`     | Run unit tests                         |
| `pnpm test:e2e:ci` | Run E2E tests                          |

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
- `docs/operations/production-release-runbook.md` : maintenance, migration, activation et rollback.
- `docs/operations/completion-audit-2026-08-14.md` : audit phase par phase et preuves restantes.
- `docs/design-system.md` : identité et règles UI/UX.
- `docs/data-lifecycle.md` : contenu des exports, fichiers et règles de purge.
- `docs/migrations/` : historique et procédures de migration.
- `PROJECT_STATUS.md` : audit fonctionnel détaillé.

## License

MIT
