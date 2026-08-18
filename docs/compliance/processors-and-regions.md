# Sous-traitants, environnements et régions

Statut : **inventaire technique publié, preuves contractuelles absentes donc gate rouge**

Dernière revue : 2026-08-13

Ne jamais inscrire de secret ou de donnée utilisateur dans ce registre. Les
valeurs attendues sont des hôtes, régions, identifiants de compte/projet et
responsables.

| Service          | Development                               | Preview                           | Production                                       | Région/stockage vérifiés                              | Contrat/DPA                        | Owner                |
| ---------------- | ----------------------------------------- | --------------------------------- | ------------------------------------------------ | ----------------------------------------------------- | ---------------------------------- | -------------------- |
| Vercel Functions | Local ; aucun secret prod                 | Séparation non prouvée            | Projet `moodday` lié ; `fra1` demandé            | Exécution `fra1`, CDN/logs/failover à prouver         | DPA et HDS non versés              | Engineering          |
| Neon Postgres    | PostgreSQL local jetable pour les preuves | Branche dédiée requise            | Instance utilisée, séparation finale non prouvée | Région, réplication, sauvegardes et support à prouver | DPA et HDS non versés              | Engineering          |
| Vercel Blob      | Usage local simulé                        | Store/token distinct requis       | Blob privé DSAR et avatars prévus                | Région, réplication, purge et accès support à prouver | DPA et HDS non versés              | Engineering          |
| Stripe           | Compte test Moodday, charges désactivées  | Catalogue test indépendant requis | Compte live exclusivement Moodday                | Traitement/transferts à documenter                    | DPA non versé ; KYC/TVA rouges     | Finance              |
| OpenAI           | Clé dédiée Moodday locale                 | Projet dédié requis               | Projet dédié requis                              | `store=false`; région et transferts à signer          | DPA/SCC non versés                 | Product / vie privée |
| Resend           | Envois externes coupés en E2E             | Clé et domaine distincts requis   | Configuration finale non prouvée                 | Région, rétention et sous-traitants à prouver         | DPA non versé                      | Engineering          |
| Web Push/VAPID   | Clés de test uniquement                   | Clés distinctes requises          | Clés dédiées exigées                             | Endpoints propres aux navigateurs                     | Rôles et transferts non documentés | Engineering          |

## Contrôle avant release

- Les bases et clés ne sont jamais partagées entre development, preview et
  production.
- Les Price IDs, configuration de portail et endpoint webhook appartiennent au
  même compte Moodday que la clé secrète.
- L'identifiant de projet OpenAI correspond à l'environnement et un budget est
  configuré dans la console.
- Les hôtes, régions et préfixes sont contrôlés sans afficher les secrets.
- Les failovers et sauvegardes sont inclus dans la conclusion géographique.

La formule « hébergé exclusivement en Europe » reste interdite tant que toutes
les cellules production, contrats, sauvegardes et failovers ne sont pas
validés.

La liste publique factuelle et son historique sont accessibles à
`/legal/subprocessors`. Elle n'affirme aucune région ou garantie contractuelle
qui ne soit pas prouvée. PostHog n'est ni chargé ni listé pour cette release.
