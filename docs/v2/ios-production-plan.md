# Mood Day V2 — plan résiduel iOS production

Dernière mise à jour : 23 août 2026.

Ce document remplace Android comme dépendance du premier lancement. La cible
commerciale immédiate est le web et iOS. Android conserve les mêmes contrats,
mais son compte Play, Health Connect, Play Billing, TalkBack et sa recette
complète forment une release ultérieure.

## Décisions fermées

- Direction artistique : Carnet vivant.
- France, adultes 18+, frontière non médicale inchangée.
- Web + iOS pour la première mise sur le marché.
- PostgreSQL et identifiant Better Auth communs.
- Stripe pour les achats web ; StoreKit piloté par RevenueCat sur iOS.
- RevenueCat conservé. Au 23 août 2026, Pro est gratuit jusqu'à 2 500 USD de
  Monthly Tracked Revenue, puis 1 %, avec webhooks. Revue interne à 2 000 USD.
- Google Agenda dédié et calendrier iPhone volontaire.
- HealthKit sur iOS ; aucun échantillon brut Santé côté serveur.
- Aucune donnée réelle avant la conclusion HDS et l'AIPD signées.

## État du code au 23 août

### Livré dans le dépôt

- API V2, OpenAPI, client commun et enveloppes d'erreurs stables.
- Better Auth web/iOS, SecureStore, deep links et révocation d'appareil.
- Check-in adaptatif, routines, rendez-vous, artefacts de consultation, briefs
  privés, Cercle, demandes de soutien et entitlement commun.
- SQLCipher, file offline idempotente, delta pull/push et protection de la
  déconnexion.
- Stripe Checkout/portail, webhook durable, réconciliation et projection Plus.
- SDK RevenueCat iOS, paywall, restauration, gestion d'abonnement, webhook
  durable et protection contre le double abonnement.
- Google Agenda dédié, sync initiale/incrémentale, invalidation du curseur,
  lease, conflits et résolution explicite.
- Calendrier iPhone : création volontaire et import explicite d'un événement.
- HealthKit : permissions fines, collecte bornée, SQLCipher brut, agrégats
  journaliers, pause, suppression de période et révocation définitive.
- Plan de sécurité iOS privé, accessible hors ligne, avec 3114/15/112.
- Traitements iOS complets : création/modification, régimes, PRN, stock,
  corrections append-only, historiques et conflits de versions hors ligne.
- Rappels iOS locaux, facultatifs et génériques, sans nom de traitement sur
  l'écran verrouillé ni dépendance à un service push distant.
- Export complet partageable depuis iOS, suppression de la copie temporaire et
  initiation de la suppression du compte avec confirmation e-mail.
- Export V2 des check-ins, observations, agrégats Santé, sources, routines,
  rendez-vous et Cercle, sans échantillon Santé brut ni reçu d'opération.
- Brouillons de check-in et de préparation versionnés, chiffrés sur iOS,
  synchronisés avec conflit explicite et exclus des briefs de consultation.
- Préférences de langue, mouvement, taille de texte et rappels synchronisées
  entre le web et iOS ; aucun conflit ne choisit silencieusement une version.
- Purge locale refusée tant qu'un brouillon non synchronisé existe.

### À terminer dans le logiciel

Les points ci-dessous peuvent être développés sans décision commerciale
supplémentaire, mais exigent chacun tests automatisés et recette iPhone :

1. Notifications iOS
   - recetter sur iPhone réel la permission, les reprises, fuseaux et DST ;
   - confirmer le comportement après modification d'un régime et après
     révocation de la permission dans Réglages iOS ;
   - conserver le modèle local sans token tant qu'aucun besoin distant précis
     ne justifie l'ajout d'un service push.

2. Exports et suppression V2
   - supprimer une source, une période ou le compte et propager aux appareils ;
   - exporter les rendez-vous sans question privée par défaut ;
   - preuve DSAR réelle via Blob privé, expiration et purge.

3. Finition fonctionnelle Carnet vivant
   - états vide, chargement, récupérable, hors ligne, conflit et permission
     révoquée sur chaque écran de la matrice ;
   - FR/EN complet et aucune chaîne métier résiduelle non traduite ;
   - tailles dynamiques, VoiceOver, clavier externe, mouvement réduit et safe
     areas ;
   - performance des listes, images et démarrage froid.

## Configuration fournisseur à réaliser

### Apple et EAS

1. [Fait le 23 août 2026] Projet Expo/EAS lié à `@yoanndrx/mood-day`, avec
   `projectId` `973b3a37-c1d3-4dac-a327-20d4b9bbd18e`.
2. [Fait le 23 août 2026] Certificat Apple Distribution et profil App Store
   actifs dans le coffre EAS pour `fr.yodev.moodday`.
3. Enregistrer les trois bundle IDs déjà prévus : dev, preview, production.
4. Activer Sign in with Apple et HealthKit pour les bons identifiants.
5. Déclarer les URL de confidentialité, support et suppression de compte.
6. [Archive prête] Build Production signé `0.1.0 (2)` validé ; enregistrer la
   clé App Store Connect dans EAS, envoyer le binaire puis ouvrir le groupe
   TestFlight fermé sans soumission publique automatique.
7. Vérifier les purpose strings, les privacy manifests et le questionnaire App
   Privacy à partir des flux réellement observés.

L'app App Store Connect Mood Day existe sous l'Apple ID `6804466109`. Le build
EAS réussi porte l'identifiant `b9819380-b67f-4022-aab6-7d5312fb45e8` et son IPA
a passé `codesign --verify --deep --strict`. La conformité export reste ouverte
car SQLCipher constitue du chiffrement standard embarqué : aucune exemption
mensongère n'est codée dans l'Info.plist.

### RevenueCat et App Store Connect

1. Créer les produits mensuel/annuel définitifs après validation du prix TTC.
2. Créer l'entitlement `plus`, l'offering courant et relier les deux produits.
3. Configurer les apps RevenueCat Preview/Sandbox et Production sans mélanger
   leurs clés.
4. Installer le webhook avec Authorization, signature HMAC, filtre Sandbox ou
   Production et URL `/api/webhooks/revenuecat`.
5. Renseigner les allowlists produit/app côté serveur et la clé REST secrète.
6. Tester achat, restauration, renouvellement, grâce, remboursement, révocation,
   changement mensuel/annuel et transfert.
7. Vérifier achat iOS visible sur le web et achat Stripe visible sur iOS.
8. Déclencher le scénario double abonnement sans annulation automatique.
9. Créer la revue financière à 2 000 USD de MTR et vérifier le tarif RevenueCat
   avant chaque release commerciale.

### Google OAuth et Agenda

1. Finaliser l'écran de consentement et les domaines vérifiés.
2. Enregistrer les callbacks web preview/production et deep links iOS.
3. Tester création/lien de compte, refus, annulation et retrait d'autorisation.
4. Tester création de l'agenda Mood Day, aller-retour, sync incrémentale, 410,
   conflit simultané, révocation et resynchronisation.
5. Ouvrir `GOOGLE_CALENDAR_ENABLED` seulement après preuve datée.

### Stripe

1. Terminer KYC et activation encaissements/virements.
2. Valider prix et packaging, puis générer le catalogue live avec le script
   idempotent existant.
3. Créer le webhook live et la clé restreinte minimale.
4. Valider Test Clocks : essai, paiement échoué, grâce, reprise, annulation,
   remboursement et litige.
5. Effectuer un achat live contrôlé, vérifier le droit web/iOS, rembourser et
   vérifier la révocation.
6. Faire valider TVA/OSS, prix TTC et code fiscal. Stripe Tax ne doit être activé
   qu'après confirmation de l'immatriculation et du traitement comptable.

## Recette obligatoire sur iPhone réel

- Connexion e-mail, Google et Apple ; deep links dev/preview/production.
- SecureStore après redémarrage, révocation d'appareil et réauthentification.
- SQLCipher réellement actif (`cipher_version`) et données illisibles sans clé.
- Check-in, routine, dose, rendez-vous et plan hors ligne puis reconnexion.
- Changement de fuseau, heure d'été/hiver et reprise après deux semaines.
- Permission Santé partielle/refusée/révoquée ; aucun zéro inventé.
- Nuit commencée avant minuit attribuée au jour de réveil.
- Inspection réseau : aucun échantillon Santé brut, note libre ou contenu du plan.
- Calendrier natif lu uniquement après action et import sans doublon évident.
- StoreKit sandbox, restauration, remboursement et droit commun web/iOS.
- VoiceOver, texte à 200 %, contraste, cible 44 pt et mouvement réduit.
- Suppression de source Santé, de période, de compte et purge de l'appareil.

## Gates externes bloquantes

Ces éléments ne peuvent pas être fabriqués dans le dépôt et restent des refus
de mise en production tant que leur preuve n'existe pas :

- conclusion HDS signée ; AIPD, registre, DPA, rétention et sous-traitants
  approuvés ;
- validation TVA/OSS et conditions Apple/Stripe ;
- comptes App Store Connect, RevenueCat, Stripe et Google réellement configurés ;
- secrets Production présents dans les coffres, anciens secrets révoqués ;
- restauration PostgreSQL répétée avec RPO 24 h / RTO 4 h ;
- audit manuel WCAG 2.2 AA et VoiceOver ;
- TestFlight fermé et bêta accompagnée sans P0/P1 ;
- approbations Product, Engineering, sécurité, juridique et comptable liées au
  commit candidat.

## Ordre d'exécution sans date arbitraire

1. Fusionner un candidat vert et déployer une Preview isolée.
2. Terminer la finition transversale et la propagation des suppressions.
3. Configurer Apple/EAS, RevenueCat sandbox, Google OAuth et Stripe test.
4. Exécuter la matrice iPhone réel et corriger jusqu'à zéro P0/P1.
5. Fermer HDS/AIPD/DPA/TVA et répéter sauvegarde/restauration.
6. Ouvrir TestFlight fermé, puis bêta accompagnée avec flags progressifs.
7. Configurer les environnements live sans réutiliser les secrets de Preview.
8. Exécuter achat live/remboursement, suppression réelle et rollback.
9. Obtenir les approbations finales, soumettre à Apple puis promouvoir le web.
10. Après stabilisation iOS, ouvrir le lot Android et rejouer toutes les gates.

La présence de code n'ouvre jamais automatiquement un flag sensible. Chaque
flag Santé, calendrier, Cercle, IA et billing exige sa preuve fournisseur et sa
recette datée.
