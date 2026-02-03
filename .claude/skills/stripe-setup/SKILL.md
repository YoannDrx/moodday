---
name: stripe-setup
description: Configuration complète Stripe avec environnements TEST et LIVE séparés. Utilise ce skill quand l'utilisateur veut configurer Stripe, créer des produits/prix, ou gérer les environnements de paiement.
disable-model-invocation: true
allowed-tools: Bash(stripe *), Bash(vercel env *), Bash(gh secret *), Read, Edit, Write
---

# Stripe Setup - Guide Complet

Ce skill configure Stripe avec deux environnements distincts :
- **TEST** : pour le développement local et les previews
- **LIVE** : pour la production uniquement

## Prérequis

### CLIs requis

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Se connecter à Stripe
stripe login

# Vérifier les autres CLIs
vercel --version  # Pour les variables d'environnement
gh --version      # Pour les secrets GitHub Actions
```

### Informations à collecter

Avant de commencer, récupère ces informations depuis [Stripe Dashboard](https://dashboard.stripe.com) :

**Mode TEST** (https://dashboard.stripe.com/test/apikeys) :
- `pk_test_...` (Publishable key)
- `sk_test_...` (Secret key)

**Mode LIVE** (https://dashboard.stripe.com/apikeys) :
- `pk_live_...` (Publishable key)
- `sk_live_...` (Secret key)

---

## Étape 1 : Créer les produits TEST

### 1.1 Créer les produits

```bash
# Produit Pro
stripe products create \
  --name="[NomApp] Pro" \
  --description="Plan Pro avec fonctionnalités avancées"

# Produit Ultra/Premium
stripe products create \
  --name="[NomApp] Ultra" \
  --description="Plan Ultra avec toutes les fonctionnalités"
```

Note les `prod_xxx` retournés.

### 1.2 Créer les prix TEST

Les prix doivent correspondre EXACTEMENT aux prix LIVE pour éviter les incohérences.

```bash
# Pro mensuel (exemple: 9,99€)
stripe prices create \
  --product=prod_XXX_PRO \
  --unit-amount=999 \
  --currency=eur \
  --recurring.interval=month

# Pro annuel (exemple: 95,90€ = -20%)
stripe prices create \
  --product=prod_XXX_PRO \
  --unit-amount=9590 \
  --currency=eur \
  --recurring.interval=year

# Ultra mensuel (exemple: 19,99€)
stripe prices create \
  --product=prod_XXX_ULTRA \
  --unit-amount=1999 \
  --currency=eur \
  --recurring.interval=month

# Ultra annuel (exemple: 191,90€ = -20%)
stripe prices create \
  --product=prod_XXX_ULTRA \
  --unit-amount=19190 \
  --currency=eur \
  --recurring.interval=year
```

Note tous les `price_xxx` retournés.

### 1.3 Vérifier les produits TEST

```bash
# Lister les produits
stripe products list --limit=10

# Lister les prix d'un produit
stripe prices list --product=prod_XXX
```

Lien : https://dashboard.stripe.com/test/products

---

## Étape 2 : Créer les produits LIVE

**IMPORTANT** : Les produits LIVE doivent avoir les MÊMES prix que les produits TEST.

### 2.1 Basculer en mode LIVE

Dans Stripe Dashboard, désactive le mode "Test" (toggle en haut à droite).

### 2.2 Créer les produits et prix LIVE

Répète les mêmes commandes qu'en TEST, ou crée-les manuellement dans le Dashboard.

Lien : https://dashboard.stripe.com/products

---

## Étape 3 : Configurer les variables d'environnement

### 3.1 Fichier `.env.local` (développement = TEST)

```bash
# Stripe TEST
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."

# Price IDs TEST
STRIPE_PRO_PLAN_ID="price_xxx_test_mensuel"
STRIPE_PRO_YEARLY_PLAN_ID="price_xxx_test_annuel"
STRIPE_ULTRA_PLAN_ID="price_xxx_test_mensuel"
STRIPE_ULTRA_YEARLY_PLAN_ID="price_xxx_test_annuel"

# Webhook secret (optionnel pour dev, voir étape 5)
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 3.2 Fichier `.env.test` (backup/documentation)

Créer un fichier `.env.test` avec toutes les variables TEST documentées :

```bash
# ==========================================
# STRIPE TEST MODE - Configuration complète
# ==========================================
# Copier dans .env.local pour développer en mode TEST

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."

# Price IDs TEST
# Pro: X,XX€/mois, XX,XX€/an
STRIPE_PRO_PLAN_ID="price_xxx"
STRIPE_PRO_YEARLY_PLAN_ID="price_xxx"

# Ultra: XX,XX€/mois, XXX,XX€/an
STRIPE_ULTRA_PLAN_ID="price_xxx"
STRIPE_ULTRA_YEARLY_PLAN_ID="price_xxx"

STRIPE_WEBHOOK_SECRET="whsec_xxx"
```

### 3.3 Ajouter au `.gitignore`

```bash
echo ".env.test" >> .gitignore
```

---

## Étape 4 : Configurer Vercel

### 4.1 Variables LIVE (Production uniquement)

```bash
# Clés LIVE
echo "pk_live_..." | vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production --force
echo "sk_live_..." | vercel env add STRIPE_SECRET_KEY production --force

# Price IDs LIVE
echo "price_xxx_live" | vercel env add STRIPE_PRO_PLAN_ID production --force
echo "price_xxx_live" | vercel env add STRIPE_PRO_YEARLY_PLAN_ID production --force
echo "price_xxx_live" | vercel env add STRIPE_ULTRA_PLAN_ID production --force
echo "price_xxx_live" | vercel env add STRIPE_ULTRA_YEARLY_PLAN_ID production --force

# Webhook secret LIVE
echo "whsec_live_xxx" | vercel env add STRIPE_WEBHOOK_SECRET production --force
```

### 4.2 Variables TEST (Development + Preview)

```bash
# Clés TEST pour Development
echo "pk_test_..." | vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY development --force
echo "sk_test_..." | vercel env add STRIPE_SECRET_KEY development --force
echo "price_xxx_test" | vercel env add STRIPE_PRO_PLAN_ID development --force
echo "price_xxx_test" | vercel env add STRIPE_PRO_YEARLY_PLAN_ID development --force
echo "price_xxx_test" | vercel env add STRIPE_ULTRA_PLAN_ID development --force
echo "price_xxx_test" | vercel env add STRIPE_ULTRA_YEARLY_PLAN_ID development --force

# Clés TEST pour Preview
echo "pk_test_..." | vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY preview --force
echo "sk_test_..." | vercel env add STRIPE_SECRET_KEY preview --force
echo "price_xxx_test" | vercel env add STRIPE_PRO_PLAN_ID preview --force
echo "price_xxx_test" | vercel env add STRIPE_PRO_YEARLY_PLAN_ID preview --force
echo "price_xxx_test" | vercel env add STRIPE_ULTRA_PLAN_ID preview --force
echo "price_xxx_test" | vercel env add STRIPE_ULTRA_YEARLY_PLAN_ID preview --force
```

### 4.3 Vérifier la configuration Vercel

```bash
vercel env ls
```

---

## Étape 5 : Configurer GitHub Actions (optionnel)

Si tu utilises GitHub Actions pour les tests/CI :

```bash
# Utiliser les clés LIVE pour les secrets GitHub (déploiement prod)
echo "pk_live_..." | gh secret set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
echo "sk_live_..." | gh secret set STRIPE_SECRET_KEY
echo "price_xxx_live" | gh secret set STRIPE_PRO_PLAN_ID
echo "price_xxx_live" | gh secret set STRIPE_PRO_YEARLY_PLAN_ID
echo "price_xxx_live" | gh secret set STRIPE_ULTRA_PLAN_ID
echo "price_xxx_live" | gh secret set STRIPE_ULTRA_YEARLY_PLAN_ID
```

---

## Étape 6 : Configurer les Webhooks

### 6.1 Webhook TEST (développement local)

```bash
# Démarrer l'écoute des webhooks en local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Note le webhook secret affiché (whsec_...)
# Ajoute-le dans .env.local
```

### 6.2 Webhook LIVE (production)

1. Va sur https://dashboard.stripe.com/webhooks
2. Clique "Add endpoint"
3. URL : `https://ton-domaine.com/api/webhooks/stripe`
4. Events à écouter :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copie le "Signing secret" dans Vercel production

---

## Étape 7 : Vérifications finales

### 7.1 Checklist TEST

- [ ] Produits créés dans Stripe TEST
- [ ] Prix créés (mensuel + annuel pour chaque plan)
- [ ] `.env.local` configuré avec clés TEST
- [ ] Vercel Development/Preview avec clés TEST
- [ ] Test de paiement avec carte `4242 4242 4242 4242`

### 7.2 Checklist LIVE

- [ ] Produits créés dans Stripe LIVE
- [ ] Prix IDENTIQUES au TEST
- [ ] Vercel Production avec clés LIVE
- [ ] GitHub Actions avec clés LIVE (si utilisé)
- [ ] Webhook LIVE configuré
- [ ] Test de paiement réel (petit montant)

### 7.3 Vérifier les prix correspondent

| Plan | Type | TEST | LIVE |
|------|------|------|------|
| Pro | Mensuel | X,XX€ | X,XX€ |
| Pro | Annuel | XX,XX€ | XX,XX€ |
| Ultra | Mensuel | XX,XX€ | XX,XX€ |
| Ultra | Annuel | XXX,XX€ | XXX,XX€ |

---

## Problèmes courants

### "No such price" ou "No such customer"

**Cause** : Mélange de clés TEST/LIVE avec des IDs de l'autre mode.

**Solution** :
1. Vérifier que TOUTES les variables Stripe sont du même mode
2. Si un customer a été créé dans l'autre mode, supprimer son `stripeCustomerId` :
```sql
UPDATE "user" SET "stripeCustomerId" = NULL WHERE "stripeCustomerId" = 'cus_xxx';
```

### "Expired API Key"

**Cause** : La clé API a expiré.

**Solution** :
1. Régénérer la clé dans Stripe Dashboard
2. Mettre à jour partout : `.env.local`, Vercel, GitHub

### Prix affichés incorrects dans l'UI

**Cause** : Le code utilise des prix hardcodés qui ne correspondent pas à Stripe.

**Solution** : Vérifier ces fichiers :
- Configuration des plans (`auth-plans-data.ts` ou similaire)
- Composants de pricing (landing, dashboard)
- Traductions (badges de réduction, etc.)

---

## Résumé de l'architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DÉVELOPPEMENT LOCAL                       │
│  .env.local → TEST (pk_test_, sk_test_, price_xxx_test)     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         VERCEL                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   Development   │  │     Preview     │  │  Production │  │
│  │      TEST       │  │      TEST       │  │    LIVE     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     GITHUB ACTIONS                           │
│                         LIVE                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Commandes utiles

```bash
# Voir tous les produits TEST
stripe products list

# Voir les prix d'un produit
stripe prices list --product=prod_xxx

# Activer/désactiver un produit
stripe products update prod_xxx --active=true
stripe products update prod_xxx --active=false

# Activer/désactiver un prix
stripe prices update price_xxx --active=true
stripe prices update price_xxx --active=false

# Écouter les webhooks en local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Déclencher un événement de test
stripe trigger checkout.session.completed
```
