# Sous-traitants, environnements et régions

Statut : **inventaire à compléter avec les contrats et consoles**

Dernière revue : 2026-08-07

Ne jamais inscrire de secret ou de donnée utilisateur dans ce registre. Les
valeurs attendues sont des hôtes, régions, identifiants de compte/projet et
responsables.

| Service          | Development                | Preview             | Production                        | Région/stockage vérifiés                           | Contrat/DPA  | Owner       |
| ---------------- | -------------------------- | ------------------- | --------------------------------- | -------------------------------------------------- | ------------ | ----------- |
| Vercel Functions | À renseigner               | À renseigner        | `fra1` demandé par `vercel.json`  | À contrôler après déploiement                      | À joindre    | Engineering |
| Neon Postgres    | À séparer                  | À séparer           | Hôte prod à confirmer             | `eu-central-1` annoncé, à vérifier dans la console | À joindre    | Engineering |
| Redis            | À séparer                  | À séparer           | À renseigner                      | Inconnu                                            | À joindre    | Engineering |
| Stockage exports | À séparer                  | À séparer           | À renseigner                      | Inconnu                                            | À joindre    | Engineering |
| Stripe           | Compte/projet test Moodday | Test Moodday        | Compte live exclusivement Moodday | Traitement mondial à documenter                    | À joindre    | Finance     |
| OpenAI           | Projet dédié requis        | Projet dédié requis | Projet dédié requis               | Transferts et rétention à valider                  | À joindre    | Product/DPO |
| Resend           | À séparer                  | À séparer           | À renseigner                      | Inconnu                                            | À joindre    | Engineering |
| Web Push/VAPID   | Clés dédiées               | Clés dédiées        | Clés dédiées                      | Endpoints navigateurs variables                    | À documenter | Engineering |

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
