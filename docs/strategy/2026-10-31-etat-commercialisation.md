# État de Moodday au 31 octobre 2026 : prêt à vendre ?

Réponse courte : **non**. Le produit est construit, testé et déployable, mais il
n'est ni ouvert au public, ni encaissable, ni juridiquement prêt. Il manque
surtout des décisions et des validations humaines, plus que du code.

| Dimension | État | Verdict |
| --- | --- | --- |
| Produit web | Boucle complète (point, cycle, lien, gestes, Allié, réglages) | Prêt pour une bêta fermée |
| Qualité | 791 tests unitaires, E2E sur 5 navigateurs, build, lint, types | Bon |
| Sécurité | Failles critiques corrigées (Next 16.4.3, Better Auth 1.7.14) ; une exception zod 3 documentée | Correct, rotation des secrets inachevée |
| Production | Nouvelle base Neon UE, inscriptions fermées, paiement coupé | Exploitable en bêta privée |
| Paiement | Catalogue Stripe Duo prêt, pas de clé secrète en prod | Non encaissable |
| Juridique | Textes réécrits, aucune validation ; pas de CGV | Bloquant |
| Mobile | App Expo jamais testée sur un appareil ; pas d'achat intégré | Non publiable |
| E-mails | Resend actif depuis `yodev.fr` | Fonctionnel, image de marque à revoir |

## 1. Bloquants pour vendre (P0)

1. **Validation juridique.** CGU, politique de confidentialité, consentement aux
   données de santé (article 9 du RGPD) : rien n'est validé. Le registre
   `release-approvals-core-beta-2026-10.json` compte 18 décisions en attente, et
   `release-approvals-2026-08.json` en compte 21.
2. **Décision HDS et AIPD.** Moodday traite des données de santé (symptômes,
   état psychique, cycle). Il faut décider par écrit si l'hébergement agréé
   données de santé (HDS) s'applique, et mener une analyse d'impact (AIPD).
   Neon et Vercel ne sont pas certifiés HDS.
3. **Conditions générales de vente.** Elles sont absentes : prix TTC, durée,
   renouvellement, résiliation, droit de rétractation de 14 jours et
   renoncement exprès pour un service numérique, médiateur de la consommation.
   C'est obligatoire avant tout abonnement vendu à des particuliers en France.
4. **Encaissement.** Il faut une clé Stripe restreinte propre à Moodday (le
   compte est partagé avec d'autres apps), `STRIPE_SECRET_KEY` et
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` en production, puis
   `BILLING_ENABLED=true`. Le compte affiche « Pressay » au paiement : un compte
   Stripe dédié serait plus propre. La TVA est désactivée
   (`STRIPE_TAX_ENABLED=false`) : à valider avec un comptable.
5. **Relecture santé.** Les 7 leçons du Programme Allié et les 4 guides SEO
   doivent être relus par un ou une professionnelle de santé, ainsi que les
   messages de crise. Un chiffre (Reilly, 3,2 %) n'a pas été vérifié à la source.
6. **Ancienne base de production.** Elle contient les données de santé des
   comptes de l'ancien Moodday, qui ne peuvent plus se connecter. Il faut
   informer ces personnes, leur proposer un export, puis supprimer la base
   selon la durée de conservation annoncée.

## 2. Avant d'ouvrir les inscriptions (P1)

- **Rotation des secrets.** 8 secrets sur 12 doivent encore être renouvelés dans
  les consoles des fournisseurs : Google OAuth, GitHub OAuth, clé Stripe,
  jeton Vercel Blob, ainsi que la révocation de Redis, UploadThing, PostHog et
  OpenAI. L'ancienne base Neon est à fermer.
- **Tests sur de vrais téléphones.** Notifications Expo, mode hors ligne, lien
  d'invitation. L'app n'a jamais tourné sur un appareil.
- **Achats intégrés.** Apple et Google imposent leur propre système de paiement
  pour un abonnement vendu dans l'app. RevenueCat est câblé, mais ni les
  produits App Store ou Play Store, ni les clés de production ne sont
  configurés. Sinon, il faut retirer toute mention d'achat de l'app mobile.
- **Fiches App Store et Play Store.** Captures, fiche de confidentialité,
  classification d'âge (18+), mention de santé non médicale.
- **Domaine d'envoi.** Les e-mails partent de `moodday@yodev.fr`. Pour la
  confiance et la délivrabilité, vérifier `moodday.app` dans Resend (DKIM, SPF
  et MX chez OVH).
- **URL canonique.** `BETTER_AUTH_URL` vaut `https://moodday.app`, qui redirige
  vers `www`. À aligner sur `https://www.moodday.app`, avec un test de
  connexion Google.
- **Supervision.** Pas d'outil de suivi d'erreurs (Sentry ou équivalent). Seuls
  les e-mails d'alerte opérationnelle existent ; ils ne sont pas testés en réel.
- **Séquence d'accueil.** Vérifier que les e-mails de cycle de vie restent
  transactionnels (finalité, désinscription, base légale), sinon recueillir un
  consentement.

## 3. Avant de grandir (P2)

- Remonter les seuils de couverture de tests abaissés en octobre.
- Monter les dépendances transitives restantes : zod 3 via `@expo/cli`, 5
  failles modérées, eslint 9 obsolète, recharts 2.
- Prouver la restauration et le retour arrière sur la nouvelle base Neon :
  sauvegarde, durées de reprise visées, exercice réel.
- Tester la charge sur le cron des notifications (toutes les 5 minutes) et sur
  le partage.
- Mettre en place la mesure d'audience sans cookie et les indicateurs produit
  (activation du duo, rétention du point du jour), sans aucune donnée de santé.
- V2 prévue : bilan à deux, repères multi-cycles côté partenaire, module SPM
  sévère, à décider après la question HDS.

## 4. Ce qui est fait

- Pivot complet : modèle de données, services, API v2, web, mobile, contenus, DA.
- Catalogue Stripe Duo (live et bac à sable), portail dédié, webhooks recréés.
- Nouvelle base Neon de production en UE, migration de départ appliquée.
- Secrets Better Auth, cron et webhooks renouvelés et isolés entre Production et
  Preview ; nouvelle clé Resend.
- Versions légales en production alignées sur les nouveaux textes
  (`terms-2026-11`, `privacy-2026-11`, `health-data-2026-11`).
- Failles critiques et hautes des dépendances corrigées ; lockfile régénéré avec
  pnpm 10.14.0 (la version imposée par le projet).

## 5. Ordre conseillé

1. Juriste (CGU, CGV, confidentialité, HDS, AIPD), puis relecture santé.
2. Bêta privée sur invitation, en production, sans paiement.
3. Tests sur appareils réels et publication TestFlight.
4. Clé Stripe dédiée, TVA validée, ouverture du paiement web.
5. Achats intégrés et publication sur les stores.
6. Ouverture publique des inscriptions.
