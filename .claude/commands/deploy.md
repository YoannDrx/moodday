---
description: Checklist avant déploiement production
---

# Checklist Déploiement

## Vérifications obligatoires

Avant tout déploiement, exécute ces vérifications :

```bash
# 1. TypeScript - Pas d'erreurs de type
pnpm ts

# 2. ESLint - Code propre
pnpm lint

# 3. Tests unitaires - Tous passent
pnpm test:ci

# 4. Build - Compilation réussie
pnpm build
```

Ou en une seule commande :

```bash
pnpm clean && pnpm test:ci && pnpm build
```

## Déploiement

### Preview (branche feature)

```bash
vercel
```

### Production

```bash
vercel --prod
```

## Variables d'environnement Vercel

Synchroniser les variables :

```bash
# Pull depuis Vercel
vercel env pull .env.local

# Push vers Vercel (attention)
vercel env add
```

## Post-déploiement

1. Vérifier les logs Vercel
2. Tester les fonctionnalités critiques
3. Vérifier les webhooks Stripe (si configurés)
4. Monitorer les erreurs (PostHog/Sentry si configuré)

## Rollback

En cas de problème :

```bash
# Lister les déploiements
vercel ls

# Rollback vers un déploiement précédent
vercel rollback <deployment-url>
```
