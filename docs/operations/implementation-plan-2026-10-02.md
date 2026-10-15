# Plan d’implémentation — audit du 2 octobre 2026

Branche : `codex/production-readiness-2026-10-02`. Les modifications présentes avant cette intervention sont conservées. Référence : `docs/audits/production-readiness-2026-10-02.md`.

## Ordre des travaux

1. **Intégrité** — DATA-01 : réunir le journal V1/V2 ; DATA-02 : protéger les brouillons et préférences mobiles contre les réponses tardives ; DATA-03 : sérialiser les opérations idempotentes et détecter les réutilisations divergentes.
2. **Sécurité applicative** — SEC-01 : corriger les dépendances ; SEC-03 : décoder et normaliser les avatars ; MAIL-01 : isoler explicitement le transport de test ; PERF-01 : limiter les mutations et vérifier les limites des exports.
3. **Parcours** — AUTH-01/UX-01 : fournisseurs activés explicitement et erreurs visibles ; UX-02 : appels à l’action conformes au mode d’inscription ; ARCH-01/MOB-01 : navigation V2 et promesses conformes aux fonctionnalités livrées.
4. **Publication** — LEG-01 : profils de validation ; BILL-01 : contrôles du webhook canonique ; OPS-01 : inventaire dérivé des migrations ; SEC-02 : conserver les preuves de rotation exigées sans inventer de validation.
5. **Vérification** — QA-01 : tests des régressions, types web/mobile, lint, audit des dépendances, couverture, build et parcours isolés. Inscrire les résultats réellement obtenus ci-dessous.

## Limites de clôture

Les rotations de clés, validations HDS/AIPD/contrats, consoles OAuth/Stripe et essais sur appareils nécessitent des preuves externes. Le code peut préparer et imposer ces contrôles ; aucune approbation ni preuve fournisseur ne sera fabriquée. Aucun déploiement de production n’est inclus dans cette branche.

## Journal de réalisation

- Branche créée avec les changements existants. Copie du diff initial enregistrée hors dépôt pour comparaison.
- Lots applicatifs 1 à 4 implémentés. Les protections de concurrence, le journal, l’authentification, les avatars, les quotas et l’export disposent de tests de régression.
- Lot 5 : types web/mobile, lint, build, audit, couverture, E2E et répétitions PostgreSQL exécutés. Voir le [compte rendu](implementation-closure-2026-10-02.md) et le registre de vérification associé.
- La publication reste bloquée par les preuves externes : 12 rotations et 18 approbations core-beta restent en attente. Les recettes fournisseur et appareil ne sont pas remplacées par les tests locaux.
