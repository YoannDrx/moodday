# Mood Day V2 — plan d'achèvement production

Dernière mise à jour : 23 août 2026.

Ce document est la feuille de route exécutable entre l'état courant du dépôt et
une mise en production avec de vraies données. Une fonctionnalité n'est pas
considérée comme terminée parce que son écran existe : son contrat, son mode
hors ligne, ses erreurs, son accessibilité, sa sécurité, sa télémétrie et ses
preuves de recette doivent aussi être terminés.

## Définition de « 100 % opérationnel »

Une capacité peut passer en production seulement si :

1. son parcours web et iOS prévu au lancement est complet ; Android possède sa
   propre gate de parité avant une publication ultérieure ;
2. les états vide, chargement, erreur, hors ligne, conflit et permission refusée
   sont traités ;
3. les règles métier sont partagées et testées, sans duplication dans l'UI ;
4. aucune donnée de santé ni note libre n'arrive dans les logs, notifications,
   analytics ou identifiants de fournisseurs ;
5. le contrôle d'accès, la révocation et l'idempotence sont couverts ;
6. le clavier, VoiceOver, TalkBack, les grandes tailles de texte et le mouvement
   réduit ont été vérifiés ;
7. les opérations et alertes nécessaires sont documentées et testées ;
8. le propriétaire métier a accepté les textes, limites et comportements ;
9. les gates juridiques, HDS, comptables et stores correspondantes sont signées ;
10. une preuve de recette datée est conservée dans le dossier de release.

## Lot 1 — comptes, Google et Stripe

### Google et authentification

- [x] Better Auth commun au web et au mobile.
- [x] Fournisseur Google activé seulement si l'identifiant et le secret existent.
- [x] Jeton de renouvellement demandé avec consentement explicite.
- [x] Sessions mobiles stockées dans SecureStore et schémas d'URL séparés.
- [x] Chiffrer les jetons OAuth en base et stocker l'état OAuth côté serveur.
- [x] Autoriser la liaison implicite uniquement pour un e-mail local vérifié et
      Google comme fournisseur de confiance.
- [x] Ajouter le bouton Google, les erreurs et le retour deep link sur mobile.
- [ ] Vérifier dans Google Cloud les URI web
      `/api/auth/callback/google` de preview et production.
- [ ] Vérifier les URI/schémas iOS sur de vrais development builds. Android est
      reporté à son lot de parité.
- [ ] Tester création, connexion, liaison à un compte e-mail existant, refus,
      annulation, jeton révoqué et révocation d'appareil.

### Stripe web

- [x] Checkout abonnement, portail client, webhook signé et dédupliqué.
- [x] Deux prix EUR TTC mensuel/annuel isolés dans le mode test.
- [x] Entitlement recalculé côté PostgreSQL et réconciliation planifiée.
- [x] Mettre les métadonnées attendues sur les prix de test et autoriser le
      changement de prix dans la configuration du portail.
- [x] Conserver cette configuration dans un script idempotent et fail-closed.
- [x] Répondre rapidement au webhook puis traiter les événements dans une file
      durable, avec reprise, quarantaine et alerte.
- [ ] Couvrir paiement réussi/échoué, essai, renouvellement, grâce, reprise,
      annulation, remboursement, litige et rejeu de webhook.
- [ ] Terminer l'activation/KYC Stripe : encaissements et virements sont
      actuellement désactivés sur le compte.
- [ ] Créer en mode live le produit, les prix, le portail et l'endpoint webhook ;
      enregistrer leurs identifiants uniquement dans l'environnement Production.
- [ ] Remplacer la clé secrète live par une clé restreinte au périmètre minimal.
- [ ] Faire valider par le comptable l'assujettissement TVA/OSS, l'activation de
      Stripe Tax, le comportement TTC et le code fiscal du produit.
- [ ] Réaliser un achat live contrôlé, vérifier le droit sur deux appareils, puis
      rembourser et vérifier la révocation.

**Gate lot 1 :** connexion Google réelle sur web/iOS, catalogue de test
entièrement valide, Test Clocks verts, compte live activé et achat/remboursement
live contrôlé. Aucun secret ni identifiant test ne doit être partagé avec la
production.

## Lot 2 — achats iOS et droits communs

- [ ] Configurer l'app iOS, les contrats bancaires/fiscaux Apple et App Store
      Connect sur le compte développeur existant.
- [ ] Créer les produits Plus définitifs après validation du packaging et des
      prix.
- [ ] Configurer les apps/environnements RevenueCat et l'offering `plus`.
- [x] Implémenter le webhook RevenueCat durable, signé, dédupliqué, repris par
      cron et projeté dans PostgreSQL.
- [x] Implémenter le SDK StoreKit via RevenueCat, restauration, paywall et
      ouverture de la gestion depuis la plateforme d'achat.
- [x] Masquer tout CTA concurrent lorsqu'une source est active ; expliquer sans
      annulation automatique un double abonnement.
- [ ] Couvrir en sandbox Apple grâce, remboursement, révocation, changement de
      produit et transfert sur un iPhone réel.
- [ ] Ouvrir une revue financière interne à 2 000 USD de MTR et documenter la
      décision avant le seuil RevenueCat de 2 500 USD. RevenueCat Pro est, au
      23 août 2026, gratuit jusqu'à ce seuil puis facturé 1 %, webhooks inclus.
- [ ] Reporter Google Play Billing, le compte Play et la clé RevenueCat Android
      au lot Android, sans les rendre bloquants pour iOS.

**Gate lot 2 :** matrice Stripe × StoreKit entièrement verte, avec un droit
identique sur web et iOS. La matrice Play Billing sera obligatoire avant Android.

## Lot 3 — calendriers et rendez-vous

- Finaliser `Appointment` comme source canonique et le journal de versions.
- Créer l'agenda Google Mood Day dédié et terminer sync initiale/incrémentale,
  invalidation du curseur, webhooks, désactivation et suppression.
- Ne jamais lire silencieusement les autres agendas ; importer seulement un
  événement explicitement choisi.
- [x] Implémenter le calendrier natif iOS avec permission opportune, création et
      import volontaire d'un seul événement sans lecture silencieuse.
- [ ] Rejouer cette capacité avec les conventions Android avant sa release.
- Dédupliquer les événements liés et demander un choix si Google et Mood Day ont
  tous deux changé.
- Terminer préparation, mode séance, débrief, décisions, suites et brief sans
  notes privées.

**Gate lot 3 :** aucune duplication après les scénarios concurrence, fuseau,
heure d'été/hiver, révocation et resynchronisation complète.

## Lot 4 — Santé et insights

- [x] Implémenter HealthKit iOS dans les development
      builds, avec permissions type par type et fonctionnalité intacte après refus.
- [x] Garder les échantillons bruts dans SQLCipher ; synchroniser uniquement les
      agrégats, provenance, couverture, qualité et version de calcul.
- [x] Ajouter pause de source, suppression de période et suppression définitive.
- [ ] Inspecter sur iPhone réel permissions partielles/révoquées, attribution du
      sommeil au jour de réveil, base SQLCipher et trafic réseau.
- [ ] Implémenter Health Connect dans le lot Android.
- Terminer les baselines intra-individuelles et insights déterministes en
  conservant signe, fenêtre, couverture, taille de l'échantillon et limites.
- Limiter l'IA à la reformulation des faits affichés, avec traçabilité et arrêt
  immédiat dans un contexte de crise.

**Gate lot 4 :** inspection réseau et base serveur prouvant l'absence de donnée
Santé brute ; chaque insight est reconstructible et explicable.

## Lot 5 — boucle quotidienne et synchronisation

- Achever check-in adaptatif, présence sans score, point rapide/complet et
  brouillons sans valeur arbitraire.
- Achever traitements, régimes, doses, corrections, PRN, stock et historique.
- Achever routines, occurrences, pause/reprise, timeline et revue hebdomadaire.
- Terminer SQLCipher mobile, file IndexedDB chiffrée web, pull/push delta,
  curseurs et opérations idempotentes.
- Appliquer les règles de conflit par agrégat et empêcher une purge silencieuse
  lorsqu'une mutation reste à synchroniser.
- Tester multi-appareils, réinstallation, clé locale invalide, reconnexion,
  changement de fuseau et absence prolongée.

**Gate lot 5 :** aucune opération perdue ou dupliquée dans la matrice réseau et
multi-appareils ; cinq parcours critiques passent hors ligne puis en reprise.

## Lot 6 — Cercle, sécurité et notifications

- Achever invitations, contrats lisibles, durées, permissions, demandes de
  soutien, contributions, historique et espace aidant.
- Faire prévaloir immédiatement au serveur révocation et consentement.
- [x] Rendre le plan de sécurité accessible hors ligne sur iOS et les ressources de crise
      françaises immédiatement disponibles.
- Garder les notifications génériques par défaut ; détails sensibles seulement
  sur appareil de confiance avec consentement dédié.
- Terminer IDOR, relecture, limitation de débit, rotation de secrets, suppression,
  export, journaux d'accès, sauvegarde/restauration et exercices d'incident.

**Gate lot 6 :** une session aidant active perd l'accès à la requête suivant la
révocation ; aucun contenu sensible n'apparaît dans les canaux techniques.

## Lot 7 — finition Carnet vivant et accessibilité

- Finaliser les tokens, logo, typographies, illustrations et microcopy FR/EN.
- Couvrir chaque écran/modal/sheet et tous ses états dans la matrice produit.
- Vérifier cibles 44 pt/48 dp, contrastes AA, clavier, lecteurs d'écran, tailles
  dynamiques, safe areas, navigation arrière et mouvement réduit.
- Budgéter performance, poids des illustrations, démarrage mobile, listes longues
  et transitions ; éliminer tout blocage du fil principal.
- Effectuer une recette sur petits/grands iPhone et navigateurs
  Chromium/Firefox/WebKit. La recette Android est une gate ultérieure distincte.

**Gate lot 7 :** audit WCAG 2.2 AA web et audit manuel mobile signés, sans P0/P1.

## Lot 8 — conformité, exploitation et lancement

- Conduire les entretiens restants et documenter claims, anti-scope et tests de
  compréhension en fatigue cognitive/activation élevée.
- Finaliser AIPD, registre, DPA, rétention, sous-traitants, CGU/confidentialité et
  conclusion HDS signée. Si HDS s'applique, migrer avant toute donnée réelle.
- Séparer preview/production, terminer alertes sync/webhooks/crons/entitlements,
  runbooks, astreinte, sauvegardes et restauration testée.
- Fermer les validations Product, Engineering, sécurité, juridique et comptable.
- Exécuter alpha interne, TestFlight fermé, bêta accompagnée puis revue Apple.
- Rejouer ensuite l'intégralité des gates sur Android avant toute soumission
  Play Store ; ce lot ne bloque pas le lancement iOS.

**Gate lot 8 :** aucune donnée réelle avant les signatures HDS/juridiques ; aucun
lancement avant l'absence de P0/P1 et les preuves de restauration et suppression.

## Ordre d'exécution

1. Fermer OAuth Google et le catalogue Stripe de test.
2. Durcir le traitement des webhooks et la matrice d'entitlements.
3. Terminer synchronisation/offline et la boucle quotidienne.
4. Terminer rendez-vous et calendriers.
5. Terminer Santé et insights.
6. Terminer Cercle, sécurité et notifications.
7. Rejouer toute la matrice UI/accessibilité/performance.
8. Fermer les gates externes iOS et exécuter la release iOS.
9. Ouvrir ensuite le lot Android : compte Play, Health Connect, Billing,
   TalkBack, calendrier et matrice de parité complète.

Une gate externe n'est jamais déclarée réussie par inférence. Son approbation,
son environnement et sa preuve datée doivent être disponibles avant promotion.
