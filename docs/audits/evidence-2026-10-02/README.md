# Preuves de l'audit du 2 octobre 2026

[Rapport complet](/Users/yoannandrieux/Projets/moodday/docs/audits/production-readiness-2026-10-02.md) · [Résultats structurés](/Users/yoannandrieux/Projets/moodday/docs/audits/evidence-2026-10-02/results.json).

État : `1cde6ff` avec modifications locales préexistantes. Aucune preuve de ce dossier ne certifie le déploiement actuel. Les captures de connexion sont publiques ; la capture d'historique utilise exclusivement un compte synthétique.

- [Connexion desktop](/Users/yoannandrieux/Projets/moodday/docs/audits/evidence-2026-10-02/signin.png).
- [Connexion mobile, boutons tronqués](/Users/yoannandrieux/Projets/moodday/docs/audits/evidence-2026-10-02/mobile-signin.png).
- [Historique vide après un check-in réussi](/Users/yoannandrieux/Projets/moodday/docs/audits/evidence-2026-10-02/history.png).
- [Résultat de concurrence et de rejeu modifié](/Users/yoannandrieux/Projets/moodday/docs/audits/evidence-2026-10-02/checkin-result.jsonl).
- [Résultat de course sur brouillon](/Users/yoannandrieux/Projets/moodday/docs/audits/evidence-2026-10-02/race-result.jsonl).

## Reproductions

Toutes les écritures ci-dessous nécessitent une base locale jetable, des secrets synthétiques, l'absence de jetons fournisseur réels et un adaptateur d'envoi neutralisé. Ne jamais reprendre le `.env` du dépôt comme cible de test.

1. **Historique V1/V2** : créer un compte de test ; vérifier son e-mail dans la fixture ; ouvrir sa session ; lire puis accepter les quatre consentements courants ; POST `/api/v2/check-ins` avec un UUID d'opération neuf, profondeur `quick`, jour/fuseau définis et les trois scores ; constater 201 et une ligne `CheckIn` ; ouvrir `/mood/history` sans filtre. Résultat observé : aucune entrée, zéro `MoodEntry` alors que le check-in existe.
2. **Concurrence** : créer un titulaire synthétique dans PostgreSQL ; lancer `Promise.allSettled` sur 12 appels à la vraie fonction `createCheckIn` avec les mêmes paramètres et identifiant d'opération ; compter réussites, codes d'erreur et lignes. Rejouer ensuite avec une valence différente et le même identifiant. Résultats : 1 réussite, 11 P2002, 1 ligne ; ancienne valeur retournée sans conflit explicite.
3. **Brouillon** : extraire `refreshUserDraft` directement de `apps/mobile/src/lib/local-database.ts` et transpiler la fonction avec TypeScript ; substituer une API dont la promesse est contrôlée et une table SQLite mémoire pour les adaptateurs de lecture/écriture ; commencer avec un snapshot `synced`, suspendre la réponse réseau, écrire un nouveau contenu `dirty`, puis livrer l'ancien snapshot serveur. Résultat : ancien contenu réécrit et état `synced`. Les schémas/adaptateurs sont remplacés dans ce harnais ; il prouve l'ordre des opérations de cette fonction, pas les liaisons Expo ni SQLCipher natif.

## Campagne principale

- PostgreSQL 17.11 installé localement, nouvelle instance temporaire à accès loopback et base vide ; 33 migrations.
- Build avec services sensibles fermés, identités synthétiques et clés fournisseur neutralisées.
- Serveur `http://localhost:3200`, seul domaine utilisé dans le résultat final WebAuthn/consentements.
- `pnpm test:ci --maxWorkers=2` : 1 149 succès / 182 fichiers.
- `pnpm test:coverage:release --maxWorkers=2` : assertions vertes, gate rouge selon les chiffres du JSON.
- `PLAYWRIGHT_TEST_BASE_URL=http://localhost:3200` et base explicitement isolée : `pnpm exec playwright test --workers=2` : 176 succès sur 5 profils, aucun retry de scénario.
- Tests d'intégrité, jobs et rate limiter avec la même base jetable ; toutes les preuves finales passent.

Les e-mails de vérification et services externes sont simulés : les parcours ne prouvent ni la réception dans une boîte réelle ni le premier retour Google/Apple. Les profils « mobile » de Playwright sont du web, pas React Native.

Les journaux bruts de travail sont conservés temporairement sous `/tmp/moodday-audit-20261002-*` et peuvent disparaître au nettoyage du système. Les résultats utiles et non sensibles sont synthétisés dans ce dossier. Les incidents initiaux ENOSPC et IP/localhost ne sont pas effacés de l'historique : ils sont expliqués dans le rapport et le JSON.
