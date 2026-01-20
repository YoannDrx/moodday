---
description: Guide interactif pour configurer un nouveau projet light-ts
---

# Setup du projet

Lance le script de setup interactif :

```bash
pnpm setup
```

Ce script va te guider pour :

1. **Vérifier les CLIs** - gh, vercel, neon, upstash, stripe
2. **Lier à Vercel** - Configuration du projet
3. **Créer la base NeonDB** - PostgreSQL managé
4. **Créer la base Upstash** - Redis managé
5. **Configurer Stripe** - Clés API (optionnel)
6. **Générer .env.local** - Variables d'environnement
7. **Migrer la DB** - Prisma migrations + seed
8. **Installer BMAD** - Framework agile IA (optionnel)

## Prérequis

### Installation des CLIs

```bash
npm i -g @vercel/cli neonctl @upstash/cli stripe gh
```

### Connexion aux services

```bash
gh auth login
vercel login
neon auth
upstash auth login
stripe login  # optionnel
```

## Après le setup

```bash
pnpm dev     # Lancer le serveur de dev
mgw          # Lancer mgrep watch
```

## Services utilisés

| Service | Usage | Console |
|---------|-------|---------|
| Vercel | Déploiement | https://vercel.com |
| NeonDB | PostgreSQL | https://neon.tech |
| Upstash | Redis | https://console.upstash.com |
| Stripe | Paiements | https://dashboard.stripe.com |

## BMAD-METHOD (optionnel)

BMAD (Breakthrough Method for Agile AI Driven Development) est un framework d'agents IA pour le développement agile.

### Qu'est-ce que BMAD ?

- 7 agents spécialisés (Analyst, PM, Architect, UX-Designer, SM, DEV, TEA)
- 50+ workflows guidés
- Intégration native avec Claude Code

### Après installation

Lance `/bmad` pour voir le guide d'utilisation complet.

### Documentation

- [BMAD GitHub](https://github.com/bmad-code-org/BMAD-METHOD)
- [Documentation officielle](https://docs.bmad-method.org/)
