# Pivot Moodday : SPM en couple, état de l'implémentation

**31 octobre 2026 · branche `pivot/spm-couple` · non commitée, non déployée.**
Complète l'audit et le plan du 30 octobre (`2026-10-30-audit-et-pivot-spm.md`). Le nom
Moodday est conservé.

## Ce qui a été fait

| Chantier                                                                                                                                                                                                                                                                                                                                              | État                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Table rase du métier** : traitements, thérapie, exercices, rendez-vous, routines, Cercle V1/V2, IA, Google Agenda, HealthKit, import, anciens écrans web et mobile, 33 migrations                                                                                                                                                                   | Supprimé                                                                  |
| **Schéma** : `Profile`, `Period`, `DailyCheckIn`, `CustomNeed`, `CoupleLink`, `Gesture`, `AllyProgress`, `AccessLog`, `Device` (jeton push), `LifecycleEmail` + socle (auth, consentements, facturation, notifications, exploitation)                                                                                                                 | Une migration de départ unique : `20261030120000_moodday_couple_baseline` |
| **Domaine partagé** `packages/domain` : catalogues (4 états, 14 symptômes, 12 besoins, 12 gestes), moteur de cycle (prédiction, fenêtre prémenstruelle apprise sur 2 cycles), projection partenaire, règles de notification, Programme Allié                                                                                                          | Fonctions pures, 21 tests                                                 |
| **Services** `src/features/couple` : point du jour (idempotent), règles, lien de couple (code haché HMAC, verrou consultatif, rôles complémentaires, pause, sortie des deux côtés), vue partenaire journalisée, gestes, notifications (Expo + web push, 1 par jour, heures calmes, texte neutre par défaut), abonnement Duo couvrant les deux comptes | 25 tests de service                                                       |
| **API v2** pour le mobile : `today`, `role`, `onboarding/*`, `check-in`, `periods/*`, `couple/*`, `gestures`, `ally/[slug]`, `devices`, `entitlements`                                                                                                                                                                                                | Client `packages/api-client`                                              |
| **Direction artistique « Chaud devant »** : crème, aubergine, miel, menthe ; Bricolage Grotesque + Atkinson Hyperlegible ; cartes « sticker » ; mascotte Bouyotte (bouillotte, expression selon l'état, absente de la crise) ; mode sombre                                                                                                            | Web + tokens partagés                                                     |
| **Web** : landing à deux portes, onboarding par rôle, Aujourd'hui (elle / partenaire), Cycle (calendrier), Duo, Programme Allié, Pour moi, réglages, crise                                                                                                                                                                                            | 31 scénarios E2E Chromium verts                                           |
| **Mobile Expo** : refait sur la même API (4 onglets par rôle, point hors-ligne, push Expo, leçons natives)                                                                                                                                                                                                                                            | Typecheck + 63 tests ; **jamais lancé sur appareil**                      |
| **Contenus** : 7 leçons Allié, 4 guides SEO (SPM, TDPM, aider sa partenaire, TDPM et couple), textes légaux et publics                                                                                                                                                                                                                                | **À faire relire** (santé et juridique)                                   |
| **E-mails** : séquence d'onboarding (voir `docs/product/email-sequence.md`)                                                                                                                                                                                                                                                                           | 16 tests                                                                  |

## Lancer en local

Une base PostgreSQL locale et jetable suffit ; **ne jamais pointer la base Neon
actuelle**, qui contient les données de l'ancien produit.

```bash
pnpm prisma migrate deploy   # avec DATABASE_URL vers une base locale
pnpm prisma:seed             # duo de démo : lea@moodday.test / tom@moodday.test
pnpm dev
```

Le mot de passe de démo est défini dans `prisma/seed.ts` (`SEED_DEMO_PASSWORD`).

## Ce qui reste à décider ou à faire hors du code

1. **Base de production** : la base Neon actuelle contient des données de l'ancien
   produit (santé mentale). Il faut une **nouvelle base** et la fermeture propre de
   l'ancienne (export proposé aux comptes existants, puis suppression). Le
   `vercel-build` exécute le garde-fou de migrations : il refusera la nouvelle
   migration de départ sur l'ancienne base, c'est voulu.
2. **Juridique** : nouvelles versions des CGU, de la politique de confidentialité et
   du consentement aux données de santé (`*-2026-11`) à faire valider ; AIPD ;
   décision HDS ; Expo est un nouveau sous-traitant (transfert hors UE à encadrer).
3. **Relecture santé** des leçons Allié et des guides SEO (mention en tête de chaque contenu).
4. **Stripe** : fait le 31/10/2026. Produit « Moodday Duo » (4,99 €/mois,
   34,99 €/an, clés `moodday_duo_*_eur_v1`, TTC) créé dans le bac à sable
   Moodday et sur le compte live, avec un portail client dédié en live ;
   anciens Moodday Plus/Pro/Ultra archivés ; webhook live passé sur
   `https://www.moodday.app/api/webhooks/stripe`. Le code technique du plan
   reste `plus`. Reste : reporter les identifiants live dans Vercel
   (`STRIPE_ACCOUNT_ID`, `STRIPE_PLUS_*_PRICE_ID`,
   `STRIPE_PORTAL_CONFIGURATION_ID`) ; le compte live est partagé et affiche
   « Pressay » comme nom d'entreprise au paiement.
5. **Mobile** : recette sur iPhone et Android réels (push, hors-ligne, achats),
   identifiant de projet EAS pour les jetons Expo.
6. **Secrets** : rotation des 12 secrets de l'incident du 14/08 (registre
   `docs/operations/evidence/credential-rotation-2026-08-14.json`).
   - Fait le 31/10/2026 : `BETTER_AUTH_SECRET` et `CRON_SECRET` régénérés et
     distincts en Production et Preview ; secrets des webhooks Stripe live et
     bac à sable renouvelés (points de terminaison recréés) ; secrets GitHub
     inutilisés supprimés ; clés Redis, PostHog, UploadThing et OpenAI retirées
     des `.env`. Les anciennes valeurs restent actives dans le déploiement de
     production en cours jusqu'au prochain déploiement.
   - Resend : l'ancienne clé était déjà invalide ; nouvelle clé posée le
     31/10/2026 dans `.env`, `.env.local` et Vercel (Production, Preview,
     Development, même valeur). `RESEND_AUDIENCE_ID` pointe sur l'audience
     « General ». Les e-mails partent de `Moodday <moodday@yodev.fr>`
     (`EMAIL_FROM`, seul domaine vérifié sur le compte Resend) ; le contact
     public reste `hello@moodday.app`, reçu chez OVH.
   - À faire dans les consoles : Neon (ou nouvelle base), Google OAuth, GitHub
     OAuth (ou suppression de l'app si abandonnée), clé Stripe restreinte
     propre à Moodday (le compte est partagé : ne pas renouveler la clé
     standard), Resend, jeton Vercel Blob, révocation Redis, UploadThing,
     PostHog et OpenAI. Saisir chaque nouvelle valeur avec
     `vercel env add NOM production` (et `preview`) pour qu'elle ne transite
     pas ailleurs.

## Points d'attention techniques

- Les partenaires ne lisent que `readPartnerView()` ; la note privée n'est jamais
  sélectionnée côté serveur (test dédié).
- Le partage V1/V2 d'avant le pivot n'existe plus : plus aucun doublon de modèle.
- Les seuils de couverture de release restent ceux abaissés en octobre ; à remonter.
- La Proposition « Bilan à deux », les repères sur plusieurs cycles côté partenaire
  et le module « SPM sévère » (rapport PDF) sont en V2, après décision HDS.
