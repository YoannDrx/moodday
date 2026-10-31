# Mood Day — audit produit, production et commercialisation

Date : 6 septembre 2026. Base examinée : `1cde6ff`, branche
`codex/v2-production-auth-billing`, puis correctifs locaux décrits ci-dessous.

## Décision

Suivi : le [journal d'implémentation après audit](../operations/implementation-closure-2026-09-06.md)
décrit les corrections postérieures (lecture V1/V2, confidentialité des rapports,
mutations et point natif enrichi). Les constats ci-dessous datent de l'audit ;
leurs correctifs et preuves actualisés sont dans ce journal. Le NO-GO de
commercialisation reste applicable tant que les gates externes sont ouvertes.

**NO-GO pour une ouverture commerciale et une soumission App Store publique.**
Le projet possède une infrastructure et de vrais parcours testés, mais il n'est
pas fonctionnel à 100 % au regard du plan V2. Une compilation verte, un écran
présent ou un ancien build EAS réussi ne prouve pas un parcours en production.

Le prochain jalon recommandé est un candidat interne web + iOS cohérent, puis
une recette TestFlight sur appareil réel après fermeture des gates sécurité et
juridiques. Ne pas activer les paiements pour simplement faire disparaître une
alerte webhook. Ne pas publier l'ancien binaire avec les promesses de la V2.

Les preuves d'août sont historiques. Elles ne certifient pas les modifications
de septembre, ni l'état actuel d'un fournisseur. Les éléments non vérifiables
sont marqués **non prouvés**, pas réussis ou défectueux par supposition.

## Périmètre et méthode

- Lecture du code web, API V2, services métier, mobile Expo, stockage local,
  contrats, tests, configuration de livraison et registres de release.
- Contrôles locaux : lint, TypeScript web/mobile, Vitest, build Next,
  migrations et scripts d'intégrité sur PostgreSQL 17 jetable.
- Recette navigateur sur comptes synthétiques ; aucun test destructif sur
  la base de production et aucun e-mail de test envoyé à un utilisateur.
- Contrôles externes en lecture seule : HTTP public, configuration Vercel,
  état EAS, recherche Gmail Stripe et dashboards Apple/Stripe authentifiés.
- Les écrans natifs testés dans Vitest utilisent des adaptateurs DOM : ce ne
  sont pas des preuves VoiceOver, SQLCipher, HealthKit ou StoreKit réels.
- Aucun nouveau service payant, achat, déploiement public ou soumission Apple
  effectué dans cette passe. Les changements locaux ne sont pas encore livrés.

## 1. Constats prioritaires

| ID | Priorité | Constat et conséquence | État après cette passe |
| --- | --- | --- | --- |
| SEC-01 | P0 lancement | Les 12 entrées du registre de rotation restent en attente de preuve. L'incident Preview d'août nécessite rotation, révocation et revue d'activité, pas seulement un changement local de variable. | Bloqué par preuves fournisseur |
| LEG-01 | P0 lancement | AIPD, qualification HDS, sous-traitants et approbations juridiques/comptables non clôturés. | Non signé ; ne pas simuler ces validations |
| BILL-01 | P1 | Le webhook live signalé par Stripe cible le domaine sans `www`, qui redirige en 307 vers le domaine canonique. | Diagnostic confirmé ; configuration distante à corriger |
| BILL-02 | P1 | Quand Billing est fermé, Stripe recevait un HTTP 200 sans persistance de l'événement : livraison considérée réussie, mais droits non mis à jour. | Correctif local : 503, aucun acquittement trompeur, test de non-régression |
| DATA-01 | P1 | Les check-ins V2 et le journal historique ont deux modèles. Certaines courbes et exports web lisent uniquement `MoodEntry` alors que le point rapide et iOS écrivent `CheckIn`. | À unifier avant lancement |
| MOB-01 | P1 | Repères iOS affichait une association sommeil/énergie et des compteurs fixes comme des données personnelles. | Exemple retiré ; revue et chronologie issues des données synchronisées |
| AUTH-01 | P1 | Premier compte OAuth mobile sans consentements : refus des API santé sans parcours natif de réacceptation. | Endpoint session-only, quatre choix explicites, contrôle des versions, gate native ajoutés |
| AUTH-02 | P1 | iOS ne traitait pas le retour MFA ; récupération de mot de passe absente ; échec réseau pouvait laisser la connexion occupée. | TOTP/récupération, écran de demande de lien, gestion d'erreur et remise en état ajoutés |
| AUTH-03 | P1 | Une réponse HTTP 401 non JSON pouvait empêcher l'invalidation de session dans le client partagé. | Statut HTTP prioritaire ; cas HTML, vide et JSON invalide testés |
| DAY-01 | P2 | L'arrivée tardive d'un check-in ancien pouvait cacher celui du jour dans `/today`. | Filtrage par date civile avant pagination, tests ajoutés |
| AUDIT-01 | P1 décision | L'audit Vercel comparait des valeurs `[SENSITIVE]` exportées par la CLI comme de vrais secrets et de vraies URL de base. | Faux diagnostics corrigés : valeur inaccessible = vérification impossible |
| UX-01 | P1 périmètre annoncé | Check-in complet/adaptatif, timeline unifiée, gestion d'insights et parité FR/EN ne sont pas achevés sur iOS. | Restant produit explicite |
| STORE-01 | P1 | Dernier build production EAS consulté : version 0.1.0, build 2, commit `53ead86`, terminé le 23 août ; ce n'est pas le code courant. | Nouveau candidat requis après recette et clôture des gates |
| QA-01 | P1 recette | La suite navigateur complète n'est pas verte : attentes de navigation, création d'invitation et rafraîchissement de consultation instables ; des transactions du rate limiter dépassent cinq secondes dans cette recette locale. | Mesurer et stabiliser ; ne pas conclure à une capacité de production depuis ce poste partagé |

### Webhooks Stripe : preuve précise

Le [mail du 30 août](https://mail.google.com/mail/#all/1a05264edb4656bd),
retrouvé et lu pendant l'audit, concerne bien Mood Day. Il indique :

- destination `https://moodday.app/api/webhooks/stripe` ;
- première tentative en échec le 24 août à 11:17:10 UTC ;
- arrêt annoncé au plus tard le 2 septembre à 11:17:10 UTC ;
- erreur d'acheminement sans code HTTP détaillé dans le mail.

Contrôle HTTP du 6 septembre : cette adresse renvoie un **307** vers
`https://www.moodday.app/api/webhooks/stripe`. L'adresse directe répond **405 à
HEAD**, ce qui est normal pour une route exclusivement POST. Le contrôle POST
précédent de cette passe sur le domaine canonique donnait `disabled: true`.
Cela ne constitue pas une livraison Stripe signée ni une mise à jour de droits.

Le journal Workbench confirme aussi l'erreur historique : plusieurs livraisons
des 25–27 août portent le statut **307 ERR**, notamment pour des événements
`invoice.paid` et `customer.subscription.updated`/`deleted`. Ce n'est donc plus
une simple hypothèse tirée du mail. La
[documentation Stripe](https://docs.stripe.com/webhooks) indique que les
redirections de webhook sont des échecs et qu'il faut enregistrer l'URL finale.

Ordre de réparation :

1. Lecture effectuée : destination Mood Day active sur un compte historique
   partagé. Avant modification, confirmer le compte et le catalogue destinés à
   la nouvelle commercialisation.
2. Inventorier abonnements/achats affectés en lecture seule ; déterminer les
   événements jamais reçus ou acquittés sans traitement.
3. Installer la clé restreinte dédiée, les prix/portail et le secret exact de
   cette destination dans Production, sans les partager avec Preview.
4. Déployer le candidat autorisé ; configurer l'URL canonique **avec `www`** et
   ne réactiver que la destination Mood Day concernée.
5. Prouver signature valide → enregistrement durable → traitement → droit Plus,
   puis rejeu du même événement → aucune seconde application.
6. Rejouer/réconcilier l'historique après revue, vérifier absence de dérive et
   alertes. Les retries sont bornés : un 503 n'est pas une sauvegarde éternelle.

L'accès au Dashboard demandait initialement une reconnexion. Après rétablissement
de la session, la liste Workbench affiche la destination Mood Day **active**, avec
six événements, toujours sans `www`, sur le compte historique partagé
`acct_1MpyGWH4VwBfiTEI` (destination `we_1SvcWEH4VwBfiTEI1yXg1Tmh`). La destination
utilise la version API **2022-11-15**, à contrôler contre les contrats du backend
actuel avant changement de version. La période du 31 août au 6 septembre affiche
zéro événement : son « 0 % » d'échecs ne prouve pas un rétablissement.

Un événement consulté contient un produit qui ne correspond pas au catalogue
Mood Day V2. Le compte étant partagé, ne pas attribuer toutes ces livraisons à
des clients Mood Day ni rejouer aveuglément les abonnements des autres apps.
L'inventaire des prix, comptes clients et règles d'attribution est préalable à
toute réconciliation. Aucune destination n'a été supprimée
ou modifiée : le backend Production doit être capable de traiter les événements
avant de remplacer une redirection par un acquittement sans traitement.

### App Store Connect : état réellement observé

Après rétablissement de la session, la fiche de l'app `6804466109` présente :

- version de fiche **1.0 — À finaliser avant soumission** ;
- aucun build sélectionné ;
- zéro capture iPhone dans l'emplacement 6,5 pouces affiché ;
- connexion de revue obligatoire, mais identifiants et coordonnées non remplis ;
- description FR promettant un point complet et une timeline commune, alors que
  ces parcours sont partiels dans le code iOS ;
- nouvelles réponses de catégorie d'âge demandées par Apple pour une nouvelle
  soumission ; publication manuelle sélectionnée.

Le binaire EAS 0.1.0 et la fiche 1.0 doivent être alignés sur le candidat final.
Ni le build ancien ni la description prévisionnelle ne doivent être soumis en
l'état. Aucun bouton de soumission ou de publication n'a été actionné.

### Environnements : ne pas confondre absence et masquage

Vercel liste 50 variables en Production et 52 en Preview dans le contrôle de
cette passe. Pour les variables sensibles, `env pull` fournit `[SENSITIVE]` ;
on ne peut donc **ni comparer leurs secrets, ni conclure que les bases pointent
vers le même serveur** à partir de cet export. La gate reste fermée tant que
l'isolation n'est pas attestée autrement. Google OAuth et Resend ont en revanche
des valeurs lisibles partagées qui doivent être séparées selon la politique
de release actuelle.

Treize noms attendus ne figurent pas dans la liste Production inspectée :
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `OPENAI_API_KEY`,
`RESEND_WEBHOOK_SECRET`, `REVENUECAT_ALLOWED_APP_IDS`,
`REVENUECAT_SECRET_API_KEY`, `REVENUECAT_WEBHOOK_AUTH_TOKEN`,
`REVENUECAT_WEBHOOK_SIGNING_SECRET`, `STRIPE_ACCOUNT_ID`,
`STRIPE_PLUS_MONTHLY_PRICE_ID`, `STRIPE_PLUS_YEARLY_PRICE_ID`,
`STRIPE_PORTAL_CONFIGURATION_ID`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`.

Les exigences de lancement doivent rester conditionnelles : l'absence de clé
OpenAI ne bloque pas un lancement sans IA ; l'absence de clés de paiement bloque
la vente Plus. Ne pas renseigner de fausses valeurs pour satisfaire une gate.

## 2. Matrice fonctionnelle comparée au plan V2

| Parcours | Web | iOS | Condition de clôture |
| --- | --- | --- | --- |
| Identité Carnet vivant, illustrations | Implémenté | Implémenté | Revue réelle petit écran, texte agrandi, cohérence des états et poids des images |
| Inscription et connexion e-mail | Parcours et tests existants | Connexion ; inscription ouvre le web | Recette premier compte depuis iPhone jusqu'au retour dans l'app, e-mails réels |
| Google / Apple | Intégrations présentes | Intégrations présentes | Fournisseurs, origine/callback, annulation, compte existant et premier compte testés réellement |
| MFA et récupération | Implémenté et testé | Ajoutés dans cette passe | Test natif avec TOTP, code consommé une seule fois, annulation, perte de réseau |
| Consentements et vérification | Gate existante partagée | Gate ajoutée | Test premier OAuth réel ; version périmée/retrait ; ne pas confondre consentement et simple présence de session |
| Aujourd'hui et point rapide | Implémenté V2 | Présence et trois dimensions | Envoi multi-appareils, fuseau et absence prolongée ; mesure UX <20 s à faire |
| Point complet / saisie adaptative | Ancien wizard distinct | Seulement présence/quick dans le parcours principal | Un seul modèle canonique, brouillon repris, sommeil sourcé, étapes ignorables |
| Repères et revue | Courbes historiques ; lecture V2 incomplète | Résumé réel ajouté ; pas d'insight calculé présenté | Timeline commune, filtres, baseline, couverture, même-jour/jour-suivant, contestation/masquage |
| Traitements, PRN, corrections, stock | Services et tests d'intégrité | Écrans et offline présents | Recette native complète, changement de planning et calendrier des doses, frontières horaires |
| Routines | Services/occurrences présents | Création/accomplissement présents | Confirmer toutes les opérations de modification, pause/reprise, cible hebdomadaire et offline |
| Rendez-vous et consultation | API et parcours présents | Création/détail/artifacts présents | Unifier avec les anciens objets consultation/thérapie, cycle complet préparation → séance → suite |
| Brief PDF et lien temporaire | Implémenté avec tests | Consommation via API | Même période/données partout, absence de note privée par défaut, révocation/expiration réelle |
| Google Agenda dédié | Sync et conflits implémentés, flag fermé | Parcours de connexion | Aller-retour fournisseur, token invalidé, suppression, permissions minimales, déduplication |
| Calendrier natif | Sans objet | Ajout/import choisi implémentés | Test iPhone, annulation, permission refusée/révoquée, doublon Google |
| Santé | API d'agrégats et sources | HealthKit + SQLCipher implémentés | iPhone réel : données partielles, retrait, sommeil, trafic sans brut, suppression par source |
| Cercle et demandes de soutien | API/permissions présentes | Surface native présente | Parité rôle aidant, contrat exact, expiration, session active révoquée, demande/réponse/historique |
| Plan de sécurité | Présent | Copie chiffrée locale | Accès après redémarrage en avion ; aucun besoin de paiement ou d'IA |
| Notifications | Scheduler, retries et contrôle privacy | Planification locale présente | Livraison iOS réelle et réglages système, contenu générique, changement de fuseau |
| Synchronisation | IndexedDB chiffré | SQLCipher + file/delta/conflits | Test croisé web/iOS, opérations concurrentes, rotation/clé invalide, réinstallation, reprise longue |
| Exports et suppression | JSON/CSV/PDF et suppression présents | Initiation de suppression par e-mail depuis Réglages | Parcours effectif de suppression, révocation Apple, fichiers/stockage externes, réauthentification |
| Abonnement Plus web | Catalogue test validable, vente prod fermée | Droits serveur communs prévus | Stripe live/KYC/TVA, achat/remboursement et webhook réel |
| Achat/restore iOS | Projection commune | SDK/paywall/restore présents | Produits App Store + offering, achat sandbox, remboursement, grâce et double abonnement |
| Français/anglais | Catalogues existants | Nombreux libellés FR codés en dur | Basculer toute l'application, erreurs et mails ; aucune langue promise sans recette |
| IA optionnelle | Implémentation encadrée, flag fermé | Parité non établie | Faits V2 cohérents avant reformulation ; validation humaine et fournisseur ; peut rester hors lancement |
| Android | Contrats anticipés | Hors lancement iOS | Health Connect, Play Billing, TalkBack, calendrier et recette de parité ultérieurs |

Points de code qui matérialisent les écarts :

- `src/features/insights/insights.action.ts` et
  `src/features/export/export.action.ts` : lectures `moodEntry` historiques.
- `src/features/v2/check-ins/service.ts` : écritures `checkIn` V2.
- `apps/mobile/app/(tabs)/index.tsx` : `save("presence" | "quick")`.
- `apps/mobile/app/(tabs)/_layout.tsx` : messages de navigation forcés en FR.
- `apps/mobile/.maestro/sign-in-smoke.yml` : vérifie l'écran de connexion,
  pas un utilisateur connecté ni un achat.

## 3. Correctifs livrés dans le worktree

1. Erreurs HTTP du client API : les 401 invalident la session même si un proxy
   renvoie du HTML ou un corps vide ; erreurs normalisées sans corps fournisseur.
2. Consentements : `/api/v2/account-access` permet à une session non encore
   autorisée d'obtenir les versions et d'accepter explicitement les quatre
   choix. Vérification e-mail en base, origine web, maintenance et versions
   contrôlées. Rejeu idempotent ; aucun consentement révoqué ressuscité.
3. iOS : gate avant affichage du suivi, marqueur hors ligne par propriétaire
   conservé dans SecureStore seulement après vérification positive. Un refus
   serveur ne devient pas une autorisation hors ligne. Déconnexion bloquée
   lorsque des opérations locales restent à synchroniser.
4. Connexion native : écran défilant, récupération par e-mail, étape TOTP ou
   code de secours, erreurs réseau récupérables et fin systématique du chargement.
5. Repères iOS : compteurs locaux dédupliqués, fenêtre de sept dates civiles,
   présence distinguée des scores, zéros conservés, prises annulées exclues,
   chronologie sans note privée, source/fuseau et limites explicites.
6. `/today` : sélection de la journée demandée avant limitation du résultat.
7. Audit Vercel : placeholders sensibles non comparés comme de vrais secrets.
8. Stripe : HTTP 503 lorsque Billing est fermé, sans perte silencieuse par 200.
9. Recette : attente de navigation au lieu de `networkidle`, timeout de démarrage
   tenant compte du build optimisé ; aucun retry ajouté.
10. Fixtures E2E : version d'export alignée sur le contrat 2.5 et check-in V2
    vérifié ; token de partage unique par scénario, au lieu d'une constante
    réutilisée entre navigateurs qui violait la contrainte SQL même après révocation.

Les nouveaux écrans d'authentification ont été revus avec les consignes React :
actions déclenchées par l'utilisateur, effets nettoyés, chargement/erreur,
contrôles accessibles et absence de rendu de données d'un autre propriétaire.
Cela ne remplace pas la recette manuelle native.

## 4. Preuves de cette passe

- Avant modifications : `pnpm verify` vert, 168 fichiers / 1 059 tests, lint,
  TypeScript, audit de dépendances, Prisma, build et frontière Vercel inclus.
- Après corrections : Vitest vert avec deux workers, **173 fichiers / 1 096 tests**.
  Le dernier test additionnel vérifie qu'un écran protégé ne lance pas ses effets
  avant acceptation. Passe native ciblée finale : **12 tests réussis** (gate et auth).
- TypeScript web et mobile réussis après correction des parcours principaux.
- Dernière vérification TypeScript web, mobile et tests natifs : réussie.
  Lint ciblé des derniers fichiers modifiés : réussi. La commande `pnpm lint:ci`
  a finalement retourné un code de sortie 0 sans diagnostic, après plus de dix
  minutes sur ce poste partagé. `pnpm verify` complet doit être rejoué sur le
  candidat final, même si sa passe initiale était verte.
- 33 migrations appliquées sans erreur sur PostgreSQL 17 local isolé.
- `verify:medication-integrity` : rollback, concurrence, stock et idempotence verts.
- `verify:operational-jobs` : verrou concurrent et reprise des tâches verts.
- Playwright ciblé Chromium : deux tests offline réussis, dont reprise après
  fermeture de page et sept opérations persistées.
- Recette élargie : des attentes `networkidle` ont échoué sur un dashboard déjà
  visible. Corrigées. Une exécution ultérieure a perdu Docker/PostgreSQL en cours
  de route : 26 scénarios passent, les autres ne peuvent pas être certifiés.
- Après redémarrage de PostgreSQL, passe complète Chromium + Safari mobile,
  deux workers : **59 réussites / 10 échecs sur 69 scénarios**, en 16 minutes.
  Deux échecs portent sur l'ancienne assertion d'export 2.3, et un échec 500 de
  partage correspond au token fixe réutilisé entre projets navigateur. Ces
  fixtures ont été corrigées ; les résultats du rejeu ciblé sont séparés ci-dessous.
  Les sept autres échecs concernent navigation/timeout, invitation aidant ou
  mise à jour visible de consultation. Ils ne sont pas considérés résolus.
  Des erreurs Prisma `P2028` apparaissent aussi dans le rate limiter pendant
  la recette : mesurer la charge et les transactions avant de modifier les délais.
  Le parcours produit complet et les consentements V2 passent sur Safari mobile ;
  les scénarios offline passent sur les deux profils. Firefox et Safari desktop
  n'ont pas été rejoués dans cette passe.
- Rejeu final des exports et du partage de brief après correction des fixtures,
  un worker, Chromium + Safari mobile : **4/4 réussis**. Le téléchargement JSON
  contient le check-in V2, y compris le score zéro ; le brief exclut la note
  privée, le secret reste hors des URL réseau et la révocation coupe l'accès.
  Les trois échecs de fixtures de la passe complète sont ainsi expliqués et
  retestés, mais aucune nouvelle passe complète 69/69 n'est revendiquée.
- Un test d'export attendait encore le format JSON 2.3 alors que le service et
  ses tests unitaires produisent 2.5. L'attente est actualisée et une vraie entrée
  V2 est ajoutée à la fixture pour contrôler sa portabilité, sans identifiant
  d'opération exposé. L'export JSON inclut déjà V2 ; le problème DATA-01 concerne
  les courbes et les exports de consultation historiques, pas tout export.
- Une passe Vitest très concurrente a subi quatre timeouts de cinq secondes ;
  aucune assertion ni aucun délai n'a été relâché. Tous ces tests passent dans
  la reprise complète avec deux workers mentionnée ci-dessus.
- Bundle iOS Expo/Hermes exporté avec succès : 1 631 modules, 6,3 Mo de JavaScript
  compilé et 35 assets. URL de recette fictive ; ce n'est pas un IPA commercial
  ni un test de modules natifs sur appareil.
- Pas de preuve de livraison de cette passe sur iPhone réel, StoreKit, Google
  OAuth réel, notifications APNs, HealthKit réel ou suppression fournisseur.
- Pas de déploiement de ces modifications. Les résultats de production ne
  doivent pas être attribués au worktree non déployé.
- PostgreSQL de recette arrêté à la fin des tests ; seul le conteneur jetable
  `moodday-audit-20260906` est concerné. Ses données locales restent récupérables.

Une exécution partielle ou interrompue n'est pas une suite verte. Un succès ciblé
ne remplace pas une nouvelle exécution complète sur le candidat final.

## 5. Plan de clôture exécutable, dans l'ordre

### Lot A — sécurité et exploitation (préalable à toute nouvelle preview)

- [ ] SEC-01 : chaque secret incidenté a nouvelle valeur dédiée, ancienne valeur
  révoquée, revue d'activité et preuve datée. Ne jamais copier ces valeurs dans
  les rapports, captures ou messages.
- [ ] ENV-01 : prouver les identités de bases et l'isolation des secrets sans
  utiliser les placeholders Vercel. Séparer Google/Resend Preview et Production.
- [ ] OPS-01 : rejouer restauration/migrations du candidat exact, vérifier
  alertes crons, retards sync, événements morts et dérive des droits.
- [ ] LEG-01 : signatures AIPD/HDS/DPA/rétention ; si HDS applicable, hébergement
  conforme avant données réelles. Approbations liées au commit exact.

### Lot B — cohérence produit web/iOS

- [ ] DATA-01 : créer une lecture métier commune des observations V2 ; ne pas
  dupliquer les écritures entre `MoodEntry` et `CheckIn`. Définir explicitement
  affichage historique, dates civiles, échelles, présence et valeurs manquantes.
- [ ] DATA-02 : raccorder Aujourd'hui, Repères, timeline, consultation et exports
  à cette lecture ; préserver provenance et choix de partage des notes.
- [ ] UX-01 : achever point complet adaptatif, brouillon et saisie globale.
- [ ] CARE-01 : fermer tous les CRUD et transitions rendez-vous/routine/cercle
  réellement promis, y compris expiration, conflit et rôle aidant.
- [ ] I18N-01 : finir FR/EN natif, dates/pluriels et textes d'erreur ; remplacer
  les glyphes ambigus par des icônes accessibles cohérentes si nécessaire.
- [ ] NATIVE-01 : tests Maestro authentifiés avec données synthétiques, reset
  contrôlé et assertions serveur ; ne pas se limiter au screenshot de login.
- [ ] QA-01 : isoler les échecs navigateur encore ouverts, contrôler les latences
  du rate limiter et des mutations, puis rejouer la matrice complète sans relâcher
  les assertions de sécurité pour obtenir un résultat vert.

**Acceptation :** créer un check-in web, le lire sur iPhone, ajouter une prise
offline, fermer l'app, synchroniser, préparer le rendez-vous web et télécharger
un brief cohérent. Aucun doublon, aucune note privée ajoutée par défaut, aucun
score inventé. Rejouer avec changement de fuseau et journée sans mesure.

### Lot C — fournisseurs et vente

- [ ] AUTH-REAL : Google et Apple, premier compte/compte existant, annulation,
  e-mail vérifié, MFA et retour deep link prouvés web/iPhone.
- [ ] BILL-REAL : corriger destination Stripe, clés restreintes, catalogue live,
  compte activé, portail, TVA validée ; achat contrôlé et remboursement seulement
  dans le cadre d'une recette financière explicitement approuvée.
- [ ] IOS-IAP : produits mensuel/annuel App Store reliés au bon offering
  RevenueCat et entitlement, pas au seul Test Store ; clé SDK publique correcte,
  clés serveur privées, allowlist d'app et webhook vérifiés.
- [ ] RIGHTS : achat web visible sur iOS, achat iOS visible sur web, restauration,
  renouvellement, expiration, grâce, remboursement, transfert et double achat.
- [ ] HEALTH/CALENDAR : tests réels avec refus et retrait des permissions,
  suppression, conflit bidirectionnel et données Santé partielles.

**Acceptation :** preuve fournisseur + état PostgreSQL + UI sur deux plateformes
pour chaque cas, avec compte de test, version et date. Un badge « configured »
dans un dashboard ne suffit pas.

### Lot D — candidat App Store et lancement

- [ ] Build EAS production depuis le commit candidat propre ; nouveau numéro
  de build et vérification de l'URL API, du bundle `fr.yodev.moodday`, des
  entitlements, clés publiques, permissions et crash reports sans données santé.
- [ ] TestFlight : petit/grand iPhone, version iOS minimale et courante, vrai
  appareil, mode avion/reboot, texte agrandi, VoiceOver, mouvement réduit.
- [ ] App Store Connect : contrats, banque/fiscalité, statut commerçant,
  disponibilité France, prix, achats intégrés, âge et données de confidentialité.
- [ ] Qualification export du chiffrement SQLCipher et réponse Apple exacte ;
  ne pas déclarer une exemption par convenance technique.
- [ ] Suppression de compte initiable dans l'app, cycle e-mail réellement testé,
  désactivation des sessions et révocation des tokens tiers pertinentes.
- [ ] Captures issues du vrai binaire, description limitée aux fonctions
  livrées, liens support/confidentialité publics, compte de revue opérationnel,
  notes expliquant le caractère non diagnostique et les permissions.
- [ ] Soumission Apple après toutes les gates ; l'acceptation dépend d'Apple.
- [ ] Publication progressive, support disponible, monitoring et procédure
  rollback ; aucune acquisition payante avant la stabilité de ce premier lot.

Les exigences exactes se vérifient au dépôt selon les
[App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
et les [règles de suppression de compte](https://developer.apple.com/support/offering-account-deletion-in-your-app/).

## 6. Améliorations à forte valeur, après les blocages

1. **Centre de synchronisation lisible** : dernière sync réussie, opérations
   locales en attente, source et action de résolution ; diagnostic expurgé
   partageable volontairement au support.
2. **Revue hebdomadaire guidée** : « ce que tu as renseigné », « ce qui manque »,
   « ce que tu veux aborder au rendez-vous », sans objectif de série ni diagnostic.
3. **Répétition du contrat de partage** : prévisualisation exacte de la vue du
   proche avant validation, puis révocation accessible en un geste confirmé.
4. **Préparation progressive de consultation** : ajout d'une question depuis
   chaque observation, tri simple et mode séance très lisible hors ligne.
5. **Mode énergie basse transversal** : moins de champs, tailles de texte et
   commandes simples ; une action utile suffit, aucune relance culpabilisante.

Ces propositions approfondissent les parcours prévus. Je déconseille d'ajouter
un chat IA, des prédictions de crise ou une nouvelle collecte Santé avant d'avoir
fermé la cohérence des données et la recette de commercialisation.

## 7. Ce qui requiert le propriétaire

- Maintien des sessions Apple et Stripe ouvertes, avec reconnexion si elles
  expirent. Aucun mot de passe ni code de double authentification à transmettre
  dans le chat. Les deux dashboards ont pu être lus en fin de cette passe.
- Données et signatures légales/fiscales, validation HDS et export du chiffrement.
- Participation à la recette iPhone/TestFlight, permission Santé et achat sandbox.
- Validation finale du prix/packaging et autorisation de la recette financière
  réelle, puis de la publication du candidat validé.

Tout le reste peut avancer techniquement : corrections, tests, documentation,
configuration une fois les sessions ouvertes et préparation du candidat. Les
gates ne doivent pas être cochées à la place du fournisseur ou du signataire.
