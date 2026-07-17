# Matrice de permissions patient / aidant

Cette matrice décrit les contrôles obligatoires côté serveur. Une relation expirée, en attente, refusée ou révoquée n'accorde aucun accès.

| Ressource ou action                     | Patient propriétaire | Aidant actif avec permission            | Aidant sans permission | Tiers |
| --------------------------------------- | -------------------- | --------------------------------------- | ---------------------- | ----- |
| Voir ses propres données                | Oui                  | Sans objet                              | Sans objet             | Non   |
| Voir l'humeur partagée                  | Oui                  | `view_mood` uniquement                  | Non                    | Non   |
| Voir les traitements partagés           | Oui                  | `view_medications` uniquement           | Non                    | Non   |
| Ajouter une observation                 | Oui pour soi         | `add_observations` uniquement           | Non                    | Non   |
| Ajouter un événement                    | Oui pour soi         | `add_events` uniquement                 | Non                    | Non   |
| Modifier les permissions                | Oui                  | Non                                     | Non                    | Non   |
| Révoquer ou quitter la relation         | Oui                  | Oui, pour quitter                       | Oui, pour quitter      | Non   |
| Voir une observation masquée au patient | Non                  | Son auteur uniquement dans son activité | Son auteur uniquement  | Non   |

## Invariants

- L'identité du patient et de l'aidant provient de la session et de la relation en base, jamais d'un rôle envoyé par le client.
- Les permissions acceptées sont limitées à `view_mood`, `view_medications`, `add_observations` et `add_events`.
- Une révocation est effective dès la requête suivante : aucune permission n'est mise en cache côté client comme source d'autorité.
- Les notes de journal du patient ne font pas partie du périmètre aidant.
- Les réponses d'erreur ne révèlent pas si une relation appartenant à un autre utilisateur existe.
