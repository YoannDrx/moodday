# Moodday : audit complet et plan de pivot SPM

**Date :** 30 octobre 2026 · **Commit audité :** `6d5078c` (branche `codex/production-readiness-2026-10-02`)
**Méthode :** lecture du code web, mobile, des schémas, des tests et de la doc ; exécution de `pnpm ts`, `pnpm lint:ci` et `pnpm test:ci` ; recherche de marché ; vérification des domaines auprès des registres (whois AFNIC et Verisign). Aucun fichier produit n'a été modifié.

---

## 0. En bref

1. **Techniquement, Moodday est solide et propre.** Typecheck et lint sont verts, et **206 fichiers, soit 1 387 tests unitaires**, passent. L'audit du 2 octobre recensait 176 scénarios Playwright verts sur 5 navigateurs. Depuis, la plupart des défauts qu'il signalait sont corrigés : DATA-01, DATA-02 et DATA-03, UX-01 et UX-02, SEC-03, MAIL-01.
2. **Côté produit, Moodday s'est trop étalé.** Il fait cohabiter deux générations de modèles (V1 et V2), qui se doublent sur cinq sujets. On compte 69 modèles Prisma, une douzaine de modules derrière des drapeaux fermés par défaut, et plusieurs incohérences : un PDF réservé à Plus alors que la facturation est fermée, des permissions du Cercle V2 qui n'ouvrent l'accès à aucune donnée, Google Agenda sans dépendance à OAuth Google. **Rien n'est commercialisable en l'état** : 12 rotations de secrets et 21 décisions juridiques (HDS, AIPD, bases légales) sont toujours en attente.
3. **Le pivot SPM couple a du sens, à une condition : en vérifier la demande avant de tout reconstruire.** Une quinzaine d'apps « couple + cycle » existent déjà, mais presque toutes ont **moins de 15 avis**. Le besoin est réel (SPM gênant pour environ 1/3 des 20 à 40 % de femmes concernées, TDPM chez 3 à 5 %), mais la traction de ces apps n'est pas démontrée. Notre différence doit tenir sur trois piliers : **la boucle besoin → geste** (personne ne la structure), **le sérieux santé mentale et TDPM** (personne en France) et **un consentement strict**.
4. **Il ne faut pas repartir de zéro côté code.** Le socle transverse représente des mois de durcissement : authentification, consentements, RGPD, hors-ligne chiffré, synchronisation idempotente, facturation multi-stores, crise, CSP, exploitation. En revanche, **environ 55 à 60 % du métier est à supprimer.** Je recommande une copie du dépôt (historique conservé), une **nouvelle base avec une migration de départ unique**, une soustraction massive, puis le nouveau métier.
5. **Nom retenu : « Bouyotte ».** Ses domaines .fr, .com, .app, .eu et .co sont libres (les .fr et .com vérifiés auprès des registres), et aucune app ne porte ce nom. À l'oral, on entend « bouillotte ». La signature partenaire « Sois sa bouillotte. » reste intacte. Le Y, deux traits qui se rejoignent, devient le symbole du couple. **HerDay et Moitié sont à abandonner** : herday.com et herday.app sont pris, moitie.fr et moitie.app aussi.
6. **SEO : le nom de domaine compte peu, le contenu compte beaucoup.** Il faut un seul domaine de marque (`bouyotte.fr`), un hub éditorial sur le SPM, le TDPM et l'angle partenaire, relu par un·e professionnel·le de santé. Les domaines **`syndrome-premenstruel.fr`**, `comprendre-spm.fr` et `monspm.fr` sont libres : à acheter par précaution et à rediriger en 301 vers les pages piliers, plutôt que d'en faire des sites séparés.

---

## 1. Audit de Moodday tel qu'il est aujourd'hui

### 1.1 Contrôles exécutés aujourd'hui

| Contrôle                                | Résultat                                                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm ts`                               | ✅ Aucune erreur                                                                                                                                             |
| `pnpm lint:ci`                          | ✅ Aucune erreur                                                                                                                                             |
| `pnpm test:ci`                          | ✅ **206 fichiers, 1 387 tests passés** (1 149 le 2 octobre)                                                                                                 |
| Couverture de release                   | ⚠️ La porte « passe », mais parce que les seuils ont été **abaissés** de 80 % à 69 ou 70 % (`vitest.config.mjs:54-76`). Ce n'est pas une correction.         |
| Playwright, audit de dépendances, build | Non relancés aujourd'hui. Dernier état connu (2 octobre) : 176 scénarios verts. Next est passé de 16.3.0 à 16.3.8, ce qui couvre les avis signalés (SEC-01). |

### 1.2 Fonctionnalités web : état réel

Légende : ✅ fonctionne de bout en bout · 🔒 fonctionne mais fermé par défaut (drapeau ou config) · 🟡 partiel · ❌ incohérent · 💀 code mort

| Fonctionnalité                                                                                           | État  | Détail                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accueil, pages légales, aide, blog (2 articles), guides                                                  | ✅    | L'accueil vouvoie, l'espace connecté tutoie                                                                                                                                                                                                                                            |
| Bandeau de crise 3114, 15, 112, 114 sur toutes les pages, `/crisis`                                      | ✅    |                                                                                                                                                                                                                                                                                        |
| Liste d'attente                                                                                          | 🟡    | Enregistrée dans `NewsletterSubscriber`, mais impossible à consulter ou exporter (pas d'admin), pas d'e-mail de confirmation ni de trace de consentement                                                                                                                               |
| Inscription e-mail, vérification, renvoi du lien                                                         | ✅ 🔒 | `PUBLIC_SIGNUP_MODE=closed` par défaut                                                                                                                                                                                                                                                 |
| Connexion, mot de passe oublié, double authentification (TOTP), passkeys, réauthentification             | ✅    |                                                                                                                                                                                                                                                                                        |
| Google, Apple, GitHub                                                                                    | 🔒    | Aucun aller-retour réel prouvé chez le fournisseur                                                                                                                                                                                                                                     |
| Consentements versionnés (18+, CGU, confidentialité, santé)                                              | ✅    | Bonne qualité                                                                                                                                                                                                                                                                          |
| Onboarding                                                                                               | 🟡    | Écrit encore dans le modèle V1 `MoodEntry` et invite les proches via le système d'aidants V1                                                                                                                                                                                           |
| « Aujourd'hui » (V2)                                                                                     | ✅    | Écrit dans `CheckIn`                                                                                                                                                                                                                                                                   |
| Journal `/mood` et saisie rapide                                                                         | 🟡    | Fonctionnent, mais écrivent en **V1** pendant que le tableau de bord écrit en **V2**                                                                                                                                                                                                   |
| Historique et recherche                                                                                  | 🟡    | Réunit désormais V1 et V2, mais les entrées V2 ne peuvent être ni modifiées ni supprimées                                                                                                                                                                                              |
| Hors-ligne PWA (IndexedDB chiffré en AES-GCM)                                                            | ✅    | Mais deux files d'attente alimentent deux modèles différents                                                                                                                                                                                                                           |
| Tendances                                                                                                | 🟡    | La page demande 90 jours, la formule gratuite plafonne à 30 et Plus est inaccessible                                                                                                                                                                                                   |
| Analyses IA                                                                                              | 🔒    | Il faut 5 variables **et** Plus, alors que la formule gratuite donne 0 génération                                                                                                                                                                                                      |
| Traitements, prises, stock, prises à la demande                                                          | ✅    | Atomicité, audit, idempotence. Le module le plus abouti, et justement hors sujet pour le pivot                                                                                                                                                                                         |
| Hub Soin, rendez-vous V2, résumé partagé `/brief`                                                        | 🟡    | Impossible de créer un rendez-vous ou une routine depuis le web                                                                                                                                                                                                                        |
| `/therapy` et `/exercises`                                                                               | ❌    | Présentés comme « Archives » alors qu'on peut encore en créer                                                                                                                                                                                                                          |
| Plan de sécurité                                                                                         | ✅    | Disponible hors-ligne                                                                                                                                                                                                                                                                  |
| Exports CSV, JSON RGPD en flux, suppression du compte                                                    | ✅    |                                                                                                                                                                                                                                                                                        |
| Export PDF de consultation                                                                               | ❌    | Réservé à Plus, qui est impossible à obtenir puisque la facturation est fermée. Le test E2E contourne en injectant un abonnement.                                                                                                                                                      |
| Import JSON                                                                                              | 🔒    | Ne sait écrire qu'en V1                                                                                                                                                                                                                                                                |
| Cercle V2 (`/circle`)                                                                                    | ❌ 🔒 | Invitation, acceptation, révocation et demandes de soutien fonctionnent, **mais les permissions n'ouvrent la lecture d'aucune donnée** : `authorizeCircleAccess` n'est jamais appelée, `ShareContract` n'est jamais écrit. Aucune notification. Le proche ne peut pas quitter le lien. |
| Espace aidant V1 (`/caregiver`)                                                                          | ❌    | Absent de la navigation, et lit uniquement V1 : les check-ins V2 lui sont invisibles                                                                                                                                                                                                   |
| Push web (VAPID)                                                                                         | 🔒    | Il faut 7 variables                                                                                                                                                                                                                                                                    |
| Google Agenda                                                                                            | ❌ 🔒 | Sa disponibilité ne vérifie pas `OAUTH_GOOGLE_ENABLED`, dont il dépend pourtant                                                                                                                                                                                                        |
| HealthKit                                                                                                | 🔒    | Côté API seulement                                                                                                                                                                                                                                                                     |
| Stripe et RevenueCat                                                                                     | 🔒    | Bien construits (file de webhooks, réconciliation), mais non éprouvés chez les fournisseurs                                                                                                                                                                                            |
| Administration                                                                                           | 🔒    | Volontairement minimale : compteurs en lecture seule                                                                                                                                                                                                                                   |
| Mode maintenance, export réglementaire, contact                                                          | ✅    |                                                                                                                                                                                                                                                                                        |
| Ancien tableau de bord (871 lignes), `getStreakData`, `getDashboardSummary`                              | 💀    |                                                                                                                                                                                                                                                                                        |
| Modèles jamais écrits : `Observation`, `Clinician`, `ShareContract`, `CaregiverContribution`, `Feedback` | 💀    |                                                                                                                                                                                                                                                                                        |

### 1.3 Application mobile (Expo)

- **18 écrans et 4 onglets** (Aujourd'hui, Repères, Soin, Cercle). Aucun écran vide.
- **Hors-ligne de bon niveau :** une base SQLCipher par compte, des opérations idempotentes, un curseur de synchronisation, une écriture conditionnelle (compare-and-swap) sur les brouillons. DATA-02 est corrigé.
- **Lacunes :** aucune notification push distante (`getExpoPushTokenAsync` n'existe nulle part) ; un Cercle uniquement en ligne, dont l'acceptation se fait sur le web ; aucune typographie de marque (police système) ; pas de mode sombre ; un seul test E2E natif (une vérification minimale de la connexion avec Maestro) ; aucune recette sur iPhone.
- **Fiche de la boutique :** la version et le titre ne correspondent pas à l'app, et les mots-clés « TDAH » et « bipolarité » sont risqués pour la revue Apple.

### 1.4 Ce qui manquerait si l'on gardait Moodday tel quel

1. Unifier V1 et V2 : écrire partout dans `CheckIn` et supprimer `MoodEntry`, le Cercle V1, `/therapy` et `/exercises`.
2. Brancher la lecture des données dans le Cercle V2 (permissions → projections), avec des notifications et une sortie du lien possible pour le proche.
3. Rendre le PDF accessible sans Plus, ou retirer cette promesse.
4. Clôturer SEC-02 (rotations de secrets) et LEG-01 (décision HDS, AIPD, contrats de sous-traitance). **Ces deux points s'imposent aussi pour le pivot.**
5. Faire la recette native sur iPhone, mettre en place le push distant, compléter la traduction anglaise (environ 13 écrans sont codés en dur en français) et harmoniser le tutoiement.
6. Remonter les seuils de couverture.

**Verdict sur Moodday :** l'ingénierie est excellente, mais il a été pensé comme une plateforme alors qu'il manque encore une boucle de valeur simple et un positionnement clair. C'est un argument de plus pour un pivot resserré.

---

## 2. Marché du SPM : ce qui est vérifié

### 2.1 Le besoin

| Indicateur         | Valeur                                                                                                                | Source                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| SPM                | 20 à 40 % des femmes en âge d'avoir des enfants, avec une gêne dans la vie quotidienne pour environ 1/3 d'entre elles | [Inserm](https://www.inserm.fr/c-est-quoi/payetoncycle-cest-quoi-le-syndrome-premenstruel/)                    |
| TDPM               | **3,2 %** quand le diagnostic est confirmé (méta-analyse portant sur 50 659 personnes)                                | [Reilly et al., 2024](https://ora.ox.ac.uk/objects/uuid:1162daa2-1b17-4587-a3e1-c706493401a1/files/rxs55mc98w) |
| TDPM et suicide    | Tentatives : rapport de cotes de 6,97 ; idées suicidaires : 3,95                                                      | [Prasad et al., 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8721500/)                                       |
| Diagnostic du TDPM | Suivi quotidien prospectif sur **2 cycles**                                                                           | [RecoMédicales](https://recomedicales.fr/recommandations/syndrome-premenstruel/)                               |
| HAS                | **Aucune recommandation dédiée** trouvée                                                                              | —                                                                                                              |

→ Le volet crise (3114) **n'est pas un détail.** C'est un critère qui conditionne le lancement, et un élément de crédibilité.

### 2.2 Concurrence (octobre 2026)

| App                                    | Partenaire                                                                                                       | Prix                                   | Traction                               | Point faible exploitable                                                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Luteal** (française)                 | Code valable 48 h. Le partenaire voit la phase, l'humeur et le compte à rebours, sans les symptômes.             | 29,99 $/an. **Le partage est payant.** | 2 avis                                 | Pas de réponse du partenaire, pas de volet TDPM. Publie déjà « comment aider sa copine pendant ses règles ». |
| **Otty**                               | Partage élément par élément, coupons de réconfort, mascotte. Le partenaire **peut saisir les dates à sa place.** | 39,99 $/an **par personne**            | Peu d'avis                             | Registre enfantin, iOS seulement, consentement faible                                                        |
| **Flow Together**                      | Missions et points d'expérience, discussion avec une IA                                                          | 19,99 $/an                             | 3,8 / 5 avis, bugs d'appairage         | Gamification, partage activé par défaut                                                                      |
| **BeKnown**                            | Check-in qui se transforme en cartes de soutien pour le partenaire                                               | Gratuit                                | 2 avis                                 | Anglais seulement                                                                                            |
| **Flo for Partners**, **Clue Connect** | Le partenaire voit le calendrier et les phases                                                                   | Clue : le partage exige Plus           | Énormes                                | Pas de boucle de réponse, rien de spécifique au couple                                                       |
| **Stardust**                           | Mode partenaire ludique                                                                                          | 24,99 à 39,99 $/an                     | 120 k avis                             | Pas en français, données utilisées pour le suivi publicitaire, astrologie                                    |
| **Me v PMDD**, **Belle Health**        | Suivi TDPM                                                                                                       | —                                      | Me v PMDD a été retirée de Google Play | Rien en français, rien pour le couple                                                                        |
| CivvyMode, GF Tracker                  | Pensées « pour hommes » ; il peut saisir lui-même                                                                | Gratuit ou freemium                    | Faible                                 | Ton viril, pas de consentement                                                                               |

**Ce que personne ne fait :**

1. une réponse structurée du partenaire (un geste) à un besoin exprimé ;
2. un volet TDPM ou santé mentale **en français**, avec le 3114 ;
3. une éducation sérieuse du partenaire, relue par un·e professionnel·le de santé ;
4. un partage de base **gratuit** (chez Clue et Luteal, il est payant).

**Le signal d'alerte à ne pas ignorer :** les nouveaux entrants plafonnent tous à quelques avis. Il faut donc **valider la demande et le canal d'acquisition avant d'investir dans l'interface.**

### 2.3 Réglementaire (à faire valider par un·e juriste)

- **Dispositif médical (MDR) :** tout dépend de la finalité déclarée. Un journal descriptif exportable reste a priori hors MDR. En revanche, **un score du type « tu as probablement un TDPM » ou un algorithme de diagnostic fait basculer l'app en dispositif médical de classe IIa** ([MDCG 2019-11 rév. 1, juin 2025](https://health.ec.europa.eu/system/files/2025-06/mdcg_2019_11_en.pdf)). → **Interdit dans le produit.**
- **RGPD article 9 :** il faut un consentement exprès, séparé des CGU et aussi facile à retirer qu'à donner ([CNIL](https://cnil.fr/fr/applications-mobiles-en-sante-et-protection-des-donnees-personnelles-les-questions-se-poser)). Le socle actuel le permet déjà.
- **Contenu des notifications :** la CNIL appelle à la prudence, car ce contenu transite par Apple et Google. → **Par défaut, une notification doit être neutre**, sans « fragile » ni symptômes sur l'écran verrouillé.
- **HDS :** l'hébergement certifié n'est a priori pas obligatoire hors activités de prévention, de diagnostic ou de soins. Mais un « rapport pour le médecin » réduit la zone grise. → Décision écrite à prendre, et architecture à garder portable vers un hébergeur certifié HDS.
- **Échelle DRSP :** elle est protégée (© Endicott & Harrison). → **Ne pas l'utiliser sans licence écrite.** Construire notre propre grille et ne jamais employer le nom « DRSP ».
- **Signal européen :** l'autorité néerlandaise de protection des données a publié en août 2026 une alerte sur les apps de règles ([AP](https://autoriteitpersoonsgegevens.nl/actueel/ap-privacyrisicos-door-gebruik-menstruatie-apps)). La confidentialité doit être un argument de vente, pas une case à cocher.

---

## 3. Les idées de la spécification HerDay passées au crible

| Idée                                                                        | Verdict                        | Pourquoi                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pivoter en gardant le socle et en retirant le volet psychiatrie             | ✅ **Oui**                     | Confirmé par l'audit : le socle est l'actif principal, le métier V1 et la partie Soin sont un passif                                                                                                                                                                                                                                                                                              |
| « Repartir de zéro »                                                        | ❌ **Non, pour le code**       | On perdrait l'authentification, les consentements, le RGPD, le hors-ligne chiffré, l'idempotence, les 1 387 tests et les portes de release. Repartir de zéro **pour la base de données, la marque, la DA et l'interface**, en revanche : oui.                                                                                                                                                     |
| Le nom HerDay                                                               | ❌                             | herday.com et herday.app sont **pris** (vérifié). Nom anglais pour un marché français, nul en SEO, à la 3ᵉ personne, et « her » exclut une partie du public alors que l'interface dit « partenaire ». La mention « déposable » n'était pas vérifiée.                                                                                                                                              |
| Le nom Moitié                                                               | ❌                             | moitie.fr et moitie.app sont **pris** (vérifié)                                                                                                                                                                                                                                                                                                                                                   |
| « Sa météo » comme nom du check-in                                          | ⚠️ À remplacer                 | Otty occupe déjà la métaphore de la météo. Avec Bouyotte, il faut un vocabulaire propre (voir §4.4).                                                                                                                                                                                                                                                                                              |
| PWA d'abord                                                                 | ⚠️ **À nuancer**               | La boucle principale, c'est la notification au partenaire. Sur iPhone, une PWA doit être ajoutée à l'écran d'accueil pour recevoir des notifications, et à ma connaissance Safari n'y affiche pas les **boutons d'action** (« Je m'occupe du dîner »). → **App Expo pour la boucle principale dès la bêta** (elle existe déjà), web pour la vitrine, le SEO, l'inscription et le Programme Allié. |
| Notification « Sa météo : fragile » sur l'écran verrouillé                  | ⚠️ À corriger                  | Par défaut : « Bouyotte · Léa a partagé son point du jour ». Le détail apparaît seulement si elle active « aperçu détaillé ».                                                                                                                                                                                                                                                                     |
| « Ses règles sont prévues dans 3 jours » côté partenaire                    | ⚠️ À rendre optionnel          | Information sensible. Ce doit être une permission distincte, désactivée par défaut.                                                                                                                                                                                                                                                                                                               |
| Le partenaire ne saisit jamais rien sur elle                                | ✅ **À graver dans le marbre** | C'est le principal différenciateur face à Otty, GF Tracker et CivvyMode                                                                                                                                                                                                                                                                                                                           |
| Pas de check-in = pas de notification, aucune déduction tirée du calendrier | ✅                             |                                                                                                                                                                                                                                                                                                                                                                                                   |
| Programme Allié de 7 jours                                                  | ✅                             | Le fait d'être relu par un·e professionnel·le est un argument marketing. Le contenu se stocke dans des fichiers, il n'a pas besoin de table.                                                                                                                                                                                                                                                      |
| Module SPM sévère avec rapport pour le médecin                              | ✅ en V2, avec garde-fous      | Un journal descriptif, sans aucun score de diagnostic (MDR), une grille maison (pas la DRSP), et une décision HDS prise avant de l'ouvrir                                                                                                                                                                                                                                                         |
| Duo à 4,99 €/mois ou 34,99 €/an pour deux                                   | ✅                             | Cohérent avec le marché. **Le partage de base, la crise et la suppression restent gratuits.** C'est un argument contre Clue et Luteal.                                                                                                                                                                                                                                                            |
| B2B mutuelles et employeurs                                                 | ➕ À ajouter (étape 3)         | Le modèle existe déjà pour l'endométriose : Lyv chez MGEN, le Collectif 3M. Rien de tel n'existe pour le SPM.                                                                                                                                                                                                                                                                                     |
| Six modèles de données à créer                                              | ⚠️ À simplifier                | `CyclePrediction` se calcule à la volée. `AllyLesson` vit dans des fichiers MDX. `NeedTemplate` est un catalogue dans le code, seuls les besoins personnalisés vont en table. `CouplePlan` s'obtient en étendant `EntitlementSnapshot`.                                                                                                                                                           |
| Landing avec deux portes Elle / Lui                                         | ✅                             | Libellés : « C'est mon cycle » et « C'est le cycle de ma ou mon partenaire »                                                                                                                                                                                                                                                                                                                      |

---

## 4. Le nom et le domaine

### 4.1 Disponibilité vérifiée aujourd'hui

✅ = libre · ❌ = pris. Les .fr et .com ont été vérifiés directement par whois (AFNIC et Verisign), les autres extensions via la recherche de domaines de Vercel.

| Nom                                                           | .fr                                       | .com | .app                    | .eu / .co       | App existante                                  | Avis                                                                                                   |
| ------------------------------------------------------------- | ----------------------------------------- | ---- | ----------------------- | --------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Bouyotte**                                                  | ✅                                        | ✅   | ✅                      | ✅ / ✅ (+ .io) | Aucune trouvée, aucune marque visible en ligne | **Retenu**, avec `sabouyotte.fr` et `tabouyotte.fr` également libres                                   |
| Bouillo                                                       | ✅                                        | ✅   | ✅                      | ✅ / ✅         | Aucune trouvée                                 | Repli n° 1 : à l'oral, on entend « bouillon » ou « bouilloire »                                        |
| Bouillotte                                                    | ❌                                        | ❌   | ✅                      | ✅ (.eu)        | Aucune trouvée                                 | Mot courant : impossible de ressortir sur « bouillotte » face aux pharmacies et à Nature & Découvertes |
| Ta Bouillotte / Sa Bouillotte                                 | ✅ (`tabouillotte.fr`, `sabouillotte.fr`) | ✅   | ✅ (`sabouillotte.app`) | —               | —                                              | À réserver pour la campagne « Sois sa bouillotte »                                                     |
| Douillette                                                    | ✅                                        | ❌   | ✅                      | ✅ (.eu)        | Un jeu proche                                  | Bonne alternative, plus féminine                                                                       |
| Jours doux                                                    | ✅ (`joursdoux.fr`, `jours-doux.fr`)      | —    | ✅                      | —               | —                                              | Plus adulte, mais expression courante et peu distinctive                                               |
| Prends soin                                                   | ✅ (`prendssoin.fr`)                      | —    | ✅                      | —               | —                                              | Trop générique                                                                                         |
| Chaufferette                                                  | ❌                                        | ❌   | ✅                      | —               | —                                              | Seul le .app est libre                                                                                 |
| HerDay                                                        | ✅                                        | ❌   | ❌                      | —               | —                                              | À abandonner                                                                                           |
| Moitié, Complice, Mollo, Accalmie, Tendrement, Velours, Cajou | ❌                                        | ❌   | ❌                      | —               | —                                              | Pris                                                                                                   |

**Domaines SEO libres :** `syndrome-premenstruel.fr`, `comprendre-spm.fr`, `monspm.fr`, `spm-couple.fr`, `cycleadeux.fr` (✅ vérifiés), ainsi que `aider-sa-copine.fr` et `lasemainedavant.fr`.

### 4.2 Pourquoi Bouyotte

- **Tout est libre**, dans toutes les extensions utiles. Aucune app ne porte ce nom, et une recherche web sur « bouyotte » ne renvoie aucune marque : la page de résultats est **à prendre**.
- **À l'oral, tout le monde entend « bouillotte ».** Le bouche-à-oreille fonctionne sans explication. C'est l'avantage décisif sur Bouillo.
- **C'est fun et assumé**, et la graphie inventée le rend plus distinctif, donc plus facile à déposer comme marque que le mot courant « bouillotte ».
- **La signature partenaire est toute trouvée** : « Sois sa bouillotte. » « Sa » s'accorde avec _bouillotte_, pas avec la personne, ce qui convient à tous les couples.
- **Risque 1 : l'effet « faute d'orthographe »**, gênant sur un sujet de santé. → **Faire du Y un choix de design qui se voit** : deux traits qui se rejoignent en un seul, donc le couple. Le Y devient le logo, l'icône d'app et le favicon (lisible à 16 px). Une fois justifiée visuellement, la graphie ne passe plus pour une erreur.
- **Risque 2 : les gens taperont « bouillotte ».** Au début, Google proposera aussi cette orthographe. → Acheter `bouillotte.app` (libre) et le rediriger en 301. Viser la requête « bouillotte app ». Écrire le nom en entier dans les contenus (« Bouyotte, l'app bouillotte du couple »). La correction automatique de Google disparaît quand la marque génère des recherches et des liens.
- **Risque 3 : un nom joueur pour un sujet qui touche au risque suicidaire.** → On le compense par la voix : marque chaleureuse, contenu adulte, et un écran de crise volontairement sobre, **sans mascotte ni humour**. Hims & Hers ou Oscar montrent qu'une marque santé peut être espiègle.

**À faire avant tout achat ou toute communication (environ 30 min) :**

1. Rechercher les marques antérieures « BOUYOTTE » et « BOUILLOTTE » sur [data.inpi.fr](https://data.inpi.fr) et [EUIPO eSearch](https://euipo.europa.eu/eSearch/), en classes 9, 42, 44 et 45.
2. Vérifier les identifiants @bouyotte sur Instagram, TikTok et YouTube.
3. Chercher « Bouyotte » sur l'App Store et Google Play.

**Je n'ai pas pu vérifier les marques déposées d'ici.**

### 4.3 Stratégie de domaines et de SEO

- **Domaine principal : `bouyotte.fr`.** Le .fr donne un signal géographique France et inspire confiance. `bouyotte.com` et `bouyotte.app` redirigent en 301 vers lui, `bouyotte.eu` est pris par précaution. Coût : environ 10 à 15 € par an et par domaine.
- **Défensif et SEO :** prendre `bouillotte.app` (le domaine qui capte les personnes qui ont entendu le nom à l'oral), `syndrome-premenstruel.fr`, `comprendre-spm.fr`, `sabouyotte.fr` et `sabouillotte.fr`, chacun redirigé en 301 vers sa page cible. Le nom de domaine exact **n'est plus un vrai facteur de classement** : un site séparé diluerait l'autorité du domaine principal, sur un sujet de santé (YMYL) où Google exige des preuves d'expertise et de fiabilité (E-E-A-T).
- **Structure du hub éditorial** sur `bouyotte.fr/guides/…`, avec l'outillage déjà présent (`content/posts`, plugin seo-kit) :
  - **Piliers :** « Syndrome prémenstruel (SPM) », « TDPM : trouble dysphorique prémenstruel », « SPM et couple ».
  - **Angle partenaire** (moins occupé, sauf par Luteal et Luna) : « Comment aider sa copine pendant le SPM », « Les phrases à éviter », « Que dire quand elle a son SPM ».
  - **Sujets libres :** « TDPM et couple », « TDPM : je m'inquiète pour ma partenaire », en lien avec le 3114.
  - **Outils qui attirent des liens :** un calculateur « quand arrive ma fenêtre SPM » et une grille imprimable sur 2 cycles (grille maison).
- **Crédibilité :** chaque article est relu et signé par un·e professionnel·le de santé (sage-femme, gynécologue ou psychiatre), avec des sources et une date de mise à jour. Commencer par 3 piliers et 6 articles satellites avant le lancement.
- **Volumes de recherche :** non vérifiés (DataForSEO n'est pas configuré). Faire un export Keyword Planner en phase 0.

### 4.4 Vocabulaire de marque proposé

| Concept                   | Proposition                                                  | Remarque                                                                            |
| ------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Check-in du jour          | **« Mon point »**, avec la question « Comment tu te sens ? » | Reprend le vocabulaire du « point » de Moodday, sans météo                          |
| 4 états                   | Ça va · Fragile · Difficile · Très dur                       | Garder ceux de la spécification, et ne jamais signaler un état par la couleur seule |
| Réponse du partenaire     | **Un geste**                                                 |                                                                                     |
| Programme partenaire      | **« L'école de la bouillotte »** ou « Programme Allié »      | Le premier est plus fidèle à la marque. À tester en entretiens.                     |
| Signature côté partenaire | « Sois sa bouillotte. »                                      |                                                                                     |
| Signature côté elle       | « Tu n'as plus à tout expliquer. »                           | Reprend le titre principal de la spécification                                      |

---

## 5. Architecture cible : garder, adapter, retirer, créer

### 5.1 Garder tel quel

Better Auth (e-mail, passkeys, double authentification, OAuth sous drapeau), consentements versionnés, export et suppression RGPD, export réglementaire, hors-ligne chiffré (web et SQLCipher), synchronisation idempotente (`operationId`, empreinte, verrou), `Device`, `SyncOperation`, `AccessLog`, facturation (Stripe, RevenueCat, entitlements), `NotificationDelivery` et l'ordonnanceur, React Email et Resend, CSP, maintenance, crise, scripts de vérification et portes de release, CI.

### 5.2 Adapter

| Existant                                 | Devient                                         | Travail                                                                                                                                                                                                                                                                                              |
| ---------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CheckIn`                                | `DailyCheckIn` (le « point »)                   | Garder l'enveloppe (`operationId`, `localDate`, `timezone`) ; remplacer les axes par `state` (4 niveaux), `symptoms[]` (0 à 3), `needs[]` (0 à 2) et `privateNote`                                                                                                                                   |
| `CircleRelationship` + `ShareContract`   | `CoupleLink` + `SharingContract`                | Un seul lien actif. **Symétrique** : chacun peut quitter. Trois niveaux de partage, plus des permissions optionnelles (`cycle_dates`, `symptoms`, `crisis_alert`). Pause de 48 h. Acceptation **dans l'app**, par code ou par lien. Factoriser le prédicat de permission (copié 4 fois aujourd'hui). |
| `authorizeCircleAccess` (jamais appelée) | `readPartnerView()`                             | **Le chantier le plus important** : une projection serveur filtrée par contrat, avec une ligne `AccessLog` à chaque lecture                                                                                                                                                                          |
| `SupportRequest`                         | `Need` (un besoin exprimé, lié au point)        | Reprendre la machine d'états (`pending`, `seen`, `answered`, `cancelled`)                                                                                                                                                                                                                            |
| `CaregiverContribution` (jamais écrit)   | `Gesture`                                       | Type (catalogue ou texte libre), message court, statut, lien vers le besoin                                                                                                                                                                                                                          |
| `PushSubscription` (web) + `Device`      | Jeton push sur `Device` (Expo) + abonnement web | Expéditeur Expo Push, file d'envoi transactionnelle (outbox) sur `NotificationDelivery`, liens profonds, règles « 1 par jour », « pas entre 22 h et 8 h » et aperçu neutre                                                                                                                           |
| `EntitlementSnapshot`                    | Droits du Duo                                   | Un payeur, deux bénéficiaires                                                                                                                                                                                                                                                                        |
| `SafetyPlan`                             | « Aide maintenant » + plan simplifié            | Numéros de crise disponibles hors-ligne, plan optionnel                                                                                                                                                                                                                                              |
| `packages/design-tokens`                 | Tokens Bouyotte                                 | **Le web doit enfin consommer ce package** (aujourd'hui, `globals.css` duplique les couleurs). Ajouter les polices et le mode sombre côté mobile.                                                                                                                                                    |
| Landing, liste d'attente                 | Landing à deux portes                           | Ajouter la trace de consentement, l'e-mail de confirmation et un export pour l'admin                                                                                                                                                                                                                 |

### 5.3 Retirer

- **V1 :** `MoodEntry`, `MoodTagDefinition`, `TherapySession`, `Exercise*`, `ConsultationPreparation`, `Caregiver*` (V1, 2 341 lignes), `Feedback`, `AIUsage`.
- **V2 Soin :** `Medication*` (7 modèles), `Appointment*`, `Clinician`, `Routine*`, `CalendarConnection`, `ExternalCalendarEvent`, `Observation`, `DailyAggregate`, `SourceConnection`.
- **Fonctions :** import, analyses IA, Google Agenda, HealthKit (à réintroduire plus tard si le flux de règles d'Apple Santé s'avère utile), écrans mobiles Soin, Repères et rendez-vous, tableau de bord mort.
- **Ampleur estimée :** environ 60 % de `app/api/v2`, 4 300 lignes sur 7 800 dans `src/features/v2`, la moitié de `packages/contracts`, 3 650 lignes sur 7 400 dans les écrans mobiles, environ 55 % de `v2.prisma`, et l'intégralité du V1.

### 5.4 Créer

| Modèle ou module                           | Rôle                                                                                                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PeriodDay`                                | Jours de règles saisis, toujours par elle : date, flux optionnel                                                                                                    |
| `cycle-engine` (code pur dans `packages/`) | Prédiction des prochaines règles, fenêtre SPM personnelle apprise à partir des points (après 2 cycles), indice de confiance. **Aucun diagnostic.** Fortement testé. |
| `CustomNeed`                               | Besoins personnalisés. Le catalogue des 12 besoins est versionné dans le code.                                                                                      |
| `AllyProgress`                             | Progression dans le Programme Allié, dont le contenu est en MDX relu                                                                                                |
| `PartnerJournal` (V2)                      | Espace Lui, privé                                                                                                                                                   |
| `CycleReview` (V2)                         | Bilan à deux                                                                                                                                                        |

---

## 6. Plan d'implémentation

Hypothèse : un développeur assisté par IA, à temps plein. Les durées sont des ordres de grandeur.

### Phase 0 · Décisions et protections (semaine 1)

- [ ] Rechercher les marques antérieures BOUYOTTE sur INPI et EUIPO, réserver les identifiants sur les réseaux, chercher sur les stores. **Déposer la marque à l'INPI** en classes 9, 42, 44 et 45 (environ 190 € pour 1 classe, plus environ 40 € par classe supplémentaire, à confirmer sur le site de l'INPI).
- [ ] Acheter `bouyotte.fr`, `.com`, `.app`, `.eu`, ainsi que `bouillotte.app`, `syndrome-premenstruel.fr`, `comprendre-spm.fr`, `sabouyotte.fr` et `sabouillotte.fr` (environ 10 domaines, entre 100 et 150 € par an).
- [ ] **Fermer proprement Moodday :** inventorier les comptes réels en production. S'il y a des utilisateurs, les prévenir 30 jours à l'avance, leur proposer l'export et supprimer leurs données ensuite. Les données psychiatriques **ne migrent pas** vers Bouyotte.
- [ ] Clôturer SEC-02 : révoquer et renouveler les 12 secrets. Toutes les clés de Bouyotte sont **neuves**, sur des projets fournisseurs distincts (Neon, Vercel, Stripe, Resend).
- [ ] Rédiger une note de finalité (« journal de bien-être et de communication de couple, sans diagnostic »), une AIPD simplifiée et une décision HDS. Prendre rendez-vous avec un·e juriste spécialisé·e en santé numérique.
- [ ] Recruter un·e professionnel·le de santé relecteur·rice (contenu du Programme Allié et du hub SEO).

### Phase 1 · Valider la demande (semaines 1 à 4, en parallèle du reste)

- [ ] Landing à deux portes sur `bouyotte.fr` avec liste d'attente : réutiliser `immersive-landing` et `waitlist.action`, et ajouter la trace de consentement.
- [ ] Mener 15 entretiens avec des femmes (dont 5 vivant un SPM sévère ou un TDPM) et 10 avec des partenaires.
- [ ] Publier 3 articles piliers SEO, puis lancer des contenus courts sur TikTok et Instagram autour de l'angle « Sois sa bouillotte ».
- [ ] **Critère de passage :** au moins 300 inscrits sur la liste d'attente, plus de 25 % de clics sur la porte partenaire, et au moins 60 % des femmes interrogées prêtes à partager leur point du jour. **En dessous, on revoit la promesse avant de construire l'interface.**

### Phase 2 · Soustraction et nouvelle fondation (semaines 2 à 4)

- [ ] Créer un nouveau dépôt `bouyotte` par copie de Moodday (historique conservé). Moodday reste figé pour sa fermeture.
- [ ] Supprimer les modules listés au §5.3, avec les tests, les routes, les contrats, les écrans mobiles et la documentation correspondants.
- [ ] Créer une **nouvelle base Neon** avec une **migration de départ unique** (on repart de zéro) et un seed synthétique.
- [ ] Renommer partout : 164 fichiers web et e-mails, plus 130 occurrences dans le mobile. Mettre à jour le bundle ID, le manifeste, les métadonnées et les e-mails.
- [ ] Recadrer les portes de release : retirer les approbations OpenAI et Google Agenda, puis **remonter les seuils de couverture** à 80 %.
- [ ] **Terminé quand** `pnpm verify` est vert et qu'un compte peut s'inscrire, consentir, exporter et supprimer ses données.

### Phase 3 · Boucle principale du MVP (semaines 4 à 9)

Ordre de construction, chaque étape testée en unitaire et en E2E :

1. **Cycle :** `PeriodDay`, `cycle-engine` (prédiction et fenêtre), écran Cycle avec « Mes règles ont commencé » et « Elles sont finies ».
2. **Point du jour :** saisie en moins de 15 s (état, symptômes, besoins, note privée), hors-ligne, modifiable dans la journée.
3. **Lien de couple :** invitation par code ou par lien, acceptation dans l'app, choix du niveau de partage avec aperçu exact (« Vue de Tom »), pause de 48 h, arrêt possible des deux côtés, message neutre à l'autre.
4. **Vue partenaire :** `readPartnerView()`, filtrée par contrat et journalisée dans `AccessLog`.
5. **Notifications :** jeton Expo sur `Device`, file d'envoi transactionnelle, règles (1 par jour, rien entre 22 h et 8 h, aperçu neutre par défaut), boutons d'action, liens profonds. Push web en solution de repli.
6. **Gestes :** suggestions de 2 à 3 gestes tirées des besoins, réponse en un tap ou par un mot, notification de retour, historique des deux côtés.
7. **Programme Allié sur 7 jours :** MDX relu, `AllyProgress`, accessible sans aucune donnée sur elle.
8. **Onboardings :** choix du rôle ; 4 écrans pour elle, puis son premier point ; 1 question pour le partenaire, puis la leçon du jour 1 ; invitation.
9. **Crise :** « Aide maintenant » visible depuis tous les écrans, hors-ligne, gratuit, sans humour.

**Terminé quand** deux comptes de test sur deux iPhone bouclent le parcours point → notification → geste → retour en moins de 30 s, y compris après un passage hors-ligne.

### Phase 4 · DA et interface (semaines 6 à 10, en chevauchement)

- [ ] Lancer le prompt DA de la spécification en remplaçant HerDay par Bouyotte et en retirant la météo comme concept. Choisir une direction, ou une hybride.
- [ ] Mettre les tokens dans `packages/design-tokens` (clair et sombre), consommés par le web (Tailwind v4) **et** le mobile, avec les polices chargées des deux côtés.
- [ ] Refaire les écrans prioritaires : landing, « Aujourd'hui » pour elle, « Aujourd'hui » pour le partenaire, saisie du point, Duo, Programme Allié, crise.
- [ ] Vérifier l'accessibilité (WCAG 2.2 AA) avec axe, VoiceOver, Dynamic Type et l'option « réduire les animations ».

### Phase 5 · Bêta fermée (semaines 10 à 14)

- [ ] Recruter 30 à 50 couples depuis la liste d'attente, sur au moins un cycle complet, via TestFlight et Android en test interne.
- [ ] **Métriques** (sans aucune donnée de santé dans les outils d'analytics) :
  - taux d'appairage sous 7 jours ;
  - part des points qui reçoivent un geste sous 12 h (**c'est l'indicateur principal**) ;
  - rétention à 30 jours **des deux** partenaires ;
  - progression dans le Programme Allié ;
  - nombre de partages mis en pause ou arrêtés.
- [ ] Faire la recette sur appareils réels : SQLCipher, mode avion, notifications, changement de compte, révocation.

### Phase 6 · Lancement, puis V2

- **Au lancement :** abonnement Duo (Stripe, RevenueCat, essai de 7 jours, la formule gratuite restant toujours visible), fiches App Store et Play factuelles, surveillance avec coupe-circuits.
- **V2 :**
  - Bilan à deux ;
  - analyses descriptives sur 3 cycles, sans aucune causalité ;
  - module « SPM sévère » : grille maison sur 2 cycles et PDF descriptif, **après décision HDS** ;
  - alerte de crise au partenaire, sur activation explicite ;
  - Espace Lui ;
  - Programme Allié sur 21 jours ;
  - double partage pour les couples où les deux ont un cycle ;
  - widget ;
  - import des règles depuis Apple Santé.
- **Étape 3 :** offre B2B pour mutuelles et employeurs (modèle Lyv), et traduction anglaise.

---

## 7. Risques principaux

| Risque                                                       | Probabilité        | Parade                                                                                                                                    |
| ------------------------------------------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Demande faible (les concurrents ont très peu d'avis)         | Élevée             | Critère de passage en phase 1, canal d'acquisition testé avant de construire l'interface                                                  |
| Dérive vers le contrôle ou la surveillance au sein du couple | Moyenne            | Elle reste la seule source de ses données, pause et arrêt sans justification, aucune déduction tirée du calendrier, message de fin neutre |
| Requalification en dispositif médical                        | Moyenne            | Aucun score ni diagnostic, finalité écrite, relecture juridique                                                                           |
| HDS imposé par le module « SPM sévère »                      | Moyenne            | Décision avant la V2, architecture portable                                                                                               |
| Notifications non délivrées sur iPhone (PWA)                 | Élevée en web seul | Natif (Expo) pour la boucle principale                                                                                                    |
| Marque « Bouyotte » déjà déposée                             | Inconnue           | Recherche INPI et EUIPO avant tout achat. Replis : Bouillo, Douillette, Jours doux                                                        |
| Graphie perçue comme une faute                               | Moyenne            | Le Y comme élément de marque visible (logo, icône), redirection depuis `bouillotte.app`                                                   |
| Sujet suicidaire mal traité                                  | Faible, mais grave | Crise gratuite et hors-ligne, relecture clinique, aucune promesse d'intervention                                                          |

---

## Sources

- Code : `docs/audits/production-readiness-2026-10-02.md`, `src/lib/features/availability.ts`, `src/features/v2/circle/service.ts`, `src/features/v2/support-requests/service.ts`, `apps/mobile/src/lib/local-database.ts`, `apps/mobile/src/lib/notifications.ts`, `vitest.config.mjs`, `packages/design-tokens/src/index.ts`.
- Marché : [Otty](https://ottyapp.com/), [Luteal](https://luteal.fr/fr/), [Flow Together](https://apps.apple.com/us/app/flow-together-period-tracker/id6755704426), [BeKnown](https://apps.apple.com/gb/app/beknown-cycle-partner-support/id6760878130), [Clue Connect](https://support.helloclue.com/hc/en-us/articles/14582034397597-How-can-I-share-my-cycle-with-someone-using-Clue-Connect), [Flo for Partners](https://help.flo.health/hc/en-us/articles/20524949465876-Do-I-need-to-have-a-subscription-to-access-Flo-for-Partners), [Stardust](https://stardust.app/faq), [Belle Health](https://digitalhealth.london/innovation-directory/profile/belle-health), [Lyv × MGEN](https://www.lassuranceenmouvement.com/2025/03/17/endometriose-mgen-accompagne-les-femmes-avec-lyv-endo/), [baromètre femtech Wavestone 2025](https://www.wavestone.com/wp-content/uploads/2025/06/barometre-femtech-france-x-wavestone-2025.pdf).
- Santé et réglementaire : [Inserm](https://www.inserm.fr/c-est-quoi/payetoncycle-cest-quoi-le-syndrome-premenstruel/), [Reilly et al. 2024](https://ora.ox.ac.uk/objects/uuid:1162daa2-1b17-4587-a3e1-c706493401a1/files/rxs55mc98w), [Prasad et al. 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8721500/), [MDCG 2019-11](https://health.ec.europa.eu/system/files/2025-06/mdcg_2019_11_en.pdf), [CNIL, applications de santé](https://cnil.fr/fr/applications-mobiles-en-sante-et-protection-des-donnees-personnelles-les-questions-se-poser), [CNIL 2024](https://www.cnil.fr/fr/applications-mobiles-votre-vie-privee-devra-etre-mieux-protegee), [IAPMD et DRSP](https://faq.iapmd.org/en/articles/8232981-what-is-drsp-and-why-is-it-important-for-pmdd-diagnosis-and-research), [3114](https://3114.fr/).
- Domaines : whois AFNIC (`whois.nic.fr`), Verisign (`whois.verisign-grs.com`) et recherche de domaines de Vercel, le 30/10/2026.
