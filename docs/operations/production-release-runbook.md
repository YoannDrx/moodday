# Moodday — runbook de mise en production France 18+

Ce document est la procédure unique de maintenance, migration, ouverture et
rollback de Moodday. Il ne constitue pas une autorisation de déployer. Toute
étape qui ne possède pas sa preuve attendue impose un arrêt en état sûr.

## Invariants non négociables

- Le commit candidat est immuable et identique dans les 21 approbations.
- Le worktree de l'opérateur est propre.
- Les douze rotations sont terminées et leurs anciennes valeurs révoquées.
- Preview et Production n'utilisent aucune valeur sensible commune.
- Billing, IA, aidants, push, import et administration restent désactivés au
  début de la maintenance.
- `AI_ROLLOUT_MODE` reste `internal` jusqu'à l'ouverture publique explicitement
  approuvée.
- Aucun secret, e-mail, URL de base complète, payload ou donnée de santé n'est
  copié dans une preuve ou un journal d'intervention.
- Une migration additive n'est pas annulée par SQL improvisé. Le rollback
  applicatif revient au dernier déploiement compatible ; une restauration de
  sauvegarde n'est utilisée que si l'intégrité de la base est compromise.
- Une seule personne exécute les commandes. Une deuxième personne contrôle les
  identifiants de cible et consigne les décisions go/no-go.

## Preuves et rôles requis

Avant de réserver la fenêtre, affecter des références non personnelles pour :

- commandement de release et décision go/no-go ;
- opérateur Vercel ;
- opérateur Neon ;
- opérateur Stripe ;
- opérateur Resend/OAuth/OpenAI/Blob ;
- responsable juridique/DPO ;
- responsable comptable ;
- responsable sécurité clinique ;
- responsable accessibilité ;
- responsable incident et communication.

Les preuves privées sont conservées hors dépôt. Le dépôt ne reçoit que les
références opaques autorisées dans les deux registres JSON.

## T−72 h et T−24 h

1. Annoncer une fenêtre maximale de deux heures, d'abord à T−72 h puis T−24 h.
2. Confirmer les contacts d'escalade et le canal de décision.
3. Confirmer que le déploiement Production précédent est encore restaurable
   sans reconstruction.
4. Répéter sur une cible isolée : migrations 12 → 24, sauvegarde/restauration,
   smoke tests, révocation des sessions non vérifiées et rollback applicatif.
5. Vérifier les politiques de sauvegarde Neon, la rétention de 30 jours et le
   MFA des administrateurs.
6. Geler le catalogue Stripe, les textes légaux, les migrations et le code.
7. Interdire tout merge ou changement de variable après le gel, sauf abandon de
   la release ou nouveau cycle complet d'approbation.

## Préflight du candidat

Définir le SHA complet du candidat sans l'écrire dans un fichier local :

```bash
export RELEASE_CANDIDATE_COMMIT=<sha-40-caracteres>
git cat-file -e "${RELEASE_CANDIDATE_COMMIT}^{commit}"
git status --short
```

La commande `git status --short` ne doit rien afficher. Exécuter ensuite les
portes locales et externes :

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm test:coverage:release
pnpm verify:migration-upgrade
pnpm verify:backup-restore
pnpm verify:operational-jobs
pnpm verify:medication-integrity
pnpm verify:credential-rotations
pnpm verify:release-approvals
pnpm verify:vercel-predeploy
```

La gate d'approbation vérifie le candidat fourni, son ascendance, la propreté du
worktree et l'absence de changement non autorisé après ce commit. Les suites
Playwright 5 profils, Lighthouse et les jobs GitHub du candidat doivent être
verts sans retry ni test ignoré.

Capturer sans secret : SHA, identifiants des runs CI, résultats, heure UTC,
opérateur, nombre de migrations attendu et décision `ready_for_maintenance`.

## Répétition fournisseur obligatoire

Sur une branche Neon isolée issue de Production :

1. relever la migration courante, les 41 tables attendues et les volumes
   agrégés des tables critiques ;
2. créer un point de restauration fournisseur ;
3. appliquer `prisma migrate deploy` avec l'URL non poolée de cette branche ;
4. exécuter le backfill prévu et le script de sessions non vérifiées ;
5. confirmer 24 migrations, 41 tables, contraintes, index et absence de dérive ;
6. exécuter les smoke tests et chronométrer un restore vers une autre branche ;
7. détruire la branche uniquement après conservation des preuves non sensibles.

Tout écart de schéma, volume inattendu, consentement fabriqué ou session non
vérifiée conservée annule la fenêtre Production.

## Entrée en maintenance

1. Confirmer que tous les flags sensibles sont `false` et que le rollout IA est
   `internal`.
2. Activer `MAINTENANCE_MODE=true` en Production et consigner l'identifiant du
   déploiement/configuration résultant.
3. Vérifier que `/status`, `/crisis` et les pages légales restent disponibles.
4. Vérifier qu'un compte connecté est envoyé vers `/maintenance`.
5. Vérifier qu'une mutation utilisateur est refusée.
6. Vérifier avec des requêtes authentifiées de contrôle que les crons et les
   webhooks Resend/Stripe renvoient 503, `Retry-After: 300` et n'ajoutent aucune
   ligne. Une requête cron invalide doit rester en 401.
7. Suspendre aussi les invocations planifiées dans le fournisseur lorsque cette
   commande est disponible ; le 503 de maintenance reste la seconde barrière.
8. Attendre la fin des leases déjà acquis, au minimum la durée maximale d'un
   worker, puis vérifier qu'aucun job n'est encore `processing`.
9. Créer et vérifier une sauvegarde Production. Relever sans contenu les
   volumes des tables critiques, la migration courante, le SHA et l'heure UTC.

Si une écriture non explicitement autorisée reste possible, rétablir le dernier
déploiement sûr et abandonner la migration.

## Migration Production

1. Contrôler deux fois que l'URL non poolée cible le projet, la branche et la
   base Production attendus. Ne jamais afficher cette URL.
2. Appliquer uniquement les migrations versionnées avec `prisma migrate deploy`.
3. Exécuter les backfills versionnés de locale et de révisions initiales.
4. Exécuter `pnpm maintenance:revoke-unverified-sessions`.
5. Ne créer aucun consentement, âge ou état de vérification artificiel.
6. Contrôler les 24 migrations, les 41 tables, les contraintes, les index, les
   volumes agrégés et les relations orphelines attendues à zéro.
7. Exécuter `prisma migrate diff` contre le schéma du candidat.
8. Déployer le candidat avec tous les flags sensibles encore fermés.
9. Contrôler `/api/health`, les logs de démarrage et l'absence de contenu
   sensible avant de quitter la maintenance.

Une migration partielle, une dérive, une perte de lignes ou un consentement
fabriqué déclenche immédiatement le protocole de rollback.

## Smoke tests du cœur

Après désactivation de la maintenance, mais avant toute activation sensible :

1. vérifier landing, statut, crise, aide et documents légaux ;
2. créer un compte synthétique, vérifier l'e-mail, les consentements et la gate
   18+ ;
3. se connecter puis tester humeur, valeur zéro, traitement, prise, thérapie,
   exercice, consultation et export ;
4. vérifier la déconnexion, la révocation de session et le refus d'un compte
   non vérifié ;
5. tester hors ligne, resynchronisation et absence de mélange entre deux
   comptes synthétiques ;
6. tester invitation, permission et révocation aidant uniquement si sa gate
   externe est déjà approuvée ; sinon vérifier son état indisponible ;
7. tester suppression de compte et apparition du job externe pseudonymisé ;
8. envoyer un webhook Resend signé et un événement Stripe de contrôle dans
   l'environnement autorisé, puis rejouer chacun sans second effet ;
9. déclencher manuellement chaque cron, vérifier verrous, heartbeat et absence
   de double livraison ;
10. inspecter les événements structurés : aucun e-mail, token, payload, note,
    URL Blob ou contenu de santé ne doit apparaître.

Tout smoke critique en échec remet immédiatement la maintenance à `true`.

## Ordre d'activation

Chaque ligne nécessite une décision consignée avant de passer à la suivante :

1. réactiver les invocations cron avec push, aidants, import, Billing et IA
   toujours fermés ;
2. déclencher le watchdog, une dead-letter synthétique, sa reprise et l'alerte
   de rétablissement ;
3. ouvrir le cercle aidant, le push et l'import uniquement si leurs recettes
   appareil/fournisseur sont signées ;
4. effectuer un achat Stripe live contrôlé au montant réel, vérifier droits,
   facture, portail et webhook, puis rembourser ;
5. activer Billing uniquement après réussite de l'étape précédente et validation
   comptable ;
6. activer l'IA pour les seuls comptes internes, vérifier timeout, fallback,
   crise et kill switch ;
7. conserver l'IA désactivée par défaut pour chaque utilisateur ;
8. passer `AI_ROLLOUT_MODE=public` seulement après la revue live, les signatures
   juridique/clinique et une nouvelle décision go/no-go ;
9. ouvrir progressivement les utilisateurs Plus opt-in.

Stripe et l'IA ne sont jamais activés simultanément dans une même opération de
configuration. Une observation stable sépare les deux changements.

## Surveillance des premières 24 heures

Surveiller en continu puis à intervalles consignés :

- disponibilité et taux 5xx ;
- heartbeats et pourcentage de rappels traités sous dix minutes ;
- retries, dead-letters et récupérations ;
- webhooks invalides, doublons et événements hors ordre ;
- divergences Stripe/locales sans correction automatique ;
- suppressions externes sous 24 heures ;
- quotas, circuit breaker et budget IA sans contenu ;
- connexions significatives et erreurs Auth ;
- absence de mélange d'identité, notification ou donnée ;
- Core Web Vitals p75 dès qu'un volume représentatif existe.

Les objectifs 99,9 % et 99 % de rappels sont des objectifs opérationnels, pas
des promesses médicales.

## Déclencheurs de rollback immédiat

- fuite, mélange ou exposition horizontale de données ;
- autorisation aidant encore active après révocation ;
- suppression erronée ou incomplète ;
- corruption ou dérive de migration ;
- taux 5xx anormal ou santé DB dégradée persistante ;
- double facturation ou droits Plus incohérents ;
- webhook non idempotent ;
- notification remise au mauvais compte/appareil ;
- sortie IA médicale, diagnostic, conseil de traitement ou gestion de crise
  incorrecte ;
- secret ou contenu sensible observé dans un log ou une preuve.

## Procédure de rollback

1. Activer immédiatement `MAINTENANCE_MODE=true`.
2. Fermer Billing, IA, aidants, push, import et administration ; remettre le
   rollout IA à `internal`.
3. Suspendre les invocations cron et conserver les files/états techniques.
4. Revenir au dernier déploiement applicatif compatible avec le schéma additif.
5. Vérifier health, volumes, migrations, webhooks et absence d'écriture.
6. N'utiliser la sauvegarde que si l'intégrité DB est compromise et après
   décision conjointe commandement/Neon/DPO ; restaurer d'abord vers une cible
   isolée et comparer les volumes.
7. Conserver les journaux techniques expurgés et ouvrir un incident.
8. Informer les responsables désignés ; ne pas relancer avant analyse de cause,
   correctif, nouvelles preuves et nouveau go/no-go.

## Clôture de release

La release n'est clôturée qu'après :

- 24 heures de surveillance documentée ;
- preuve du rollback répété et du restore fournisseur chronométré ;
- aucune alerte P0/P1 ouverte ;
- réconciliation Stripe et contrôle des suppressions ;
- vérification des rétentions et sauvegardes ;
- mise à jour de la checklist et des références de preuve ;
- compte rendu signé du go/no-go final.

Une étape non prouvée reste `pending`. Aucun opérateur ne remplit rétroactivement
une preuve à partir d'une supposition ou d'un simple succès local.
