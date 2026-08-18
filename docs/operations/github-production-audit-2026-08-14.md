# Audit GitHub de préparation Production — 14 août 2026

> État historique, remplacé par le
> [réaudit du 18 août 2026](./github-production-audit-2026-08-18.md).

Périmètre : lecture seule des métadonnées du dépôt, des permissions Actions,
des protections, des services de sécurité et des vingt dernières exécutions.
Aucun secret, contenu métier ou artefact de workflow n'a été lu.

## Résultats observés

| Contrôle                        | État GitHub actuel                                                              | Décision                            |
| ------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------- |
| Dépôt                           | privé, branche par défaut `main`                                                | conforme au périmètre privé         |
| Protection de `main`            | indisponible sur l'offre actuelle ; l'API demande GitHub Pro ou un dépôt public | gate rouge                          |
| Rulesets                        | indisponibles pour la même raison                                               | gate rouge                          |
| Code scanning                   | désactivé ; Code Security requis pour ce dépôt privé                            | gate rouge                          |
| Secret scanning                 | désactivé ; Secret Protection requis pour ce dépôt privé                        | gate rouge                          |
| Alertes de vulnérabilités       | désactivées                                                                     | gate rouge                          |
| Alertes Dependabot              | désactivées                                                                     | gate rouge                          |
| Permissions Actions             | toutes les Actions autorisées ; épinglage SHA non imposé                        | gate rouge côté plateforme          |
| Jeton automatique des workflows | lecture seule par défaut ; approbation de PR interdite                          | configuration restrictive confirmée |
| Workflows distants actifs       | qualité, Playwright et ancien scheduler notifications                           | état distant antérieur à la release |

Les nouveaux workflows gitleaks et readiness ainsi que la suppression de
l'ancien scheduler sont présents uniquement dans la branche de travail tant
qu'elle n'est pas publiée et fusionnée. CodeQL est fourni par le `default
setup` GitHub afin de conserver une seule configuration canonique. Les vingt
dernières exécutions visibles étaient celles de l'ancien scheduler sur `main`
et étaient toutes terminées avec succès. Elles ne prouvent pas le
fonctionnement du nouvel ordonnanceur Vercel.

## Durcissement réalisé dans le dépôt

Toutes les Actions distantes utilisées par les workflows sont maintenant
épinglées à un SHA Git complet de 40 caractères, résolu depuis leur tag majeur
le 14 août 2026. Un test parcourt tous les workflows et échoue si une future
référence distante revient à un tag mutable.

Ce verrou du dépôt ne remplace pas le réglage plateforme
`sha_pinning_required`, actuellement désactivé, mais réduit le risque avant que
ce réglage puisse être imposé au niveau GitHub.

GitHub documente que les protections et rulesets des dépôts privés sont
disponibles à partir de GitHub Pro :
[protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
et
[rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets).
Pour CodeQL sur un dépôt privé, GitHub Pro ne suffit pas : le dépôt doit être
porté par une organisation GitHub Team ou Enterprise avec GitHub Code Security
activé. Secret scanning et push protection privés requièrent de la même façon
GitHub Secret Protection ou GitHub Advanced Security :
[sécuriser un dépôt](https://docs.github.com/en/code-security/getting-started/quickstart-for-securing-your-repository).

## Conditions de sortie

1. Placer le dépôt privé dans une organisation GitHub Team ou Enterprise avec
   GitHub Code Security et Secret Protection, sans rendre le dépôt public pour
   contourner la gate. Un simple passage à GitHub Pro suffirait aux protections
   de branche, mais pas aux contrôles CodeQL et secrets exigés par la release.
2. Exiger sur `main` une pull request, les contrôles qualité, E2E, CodeQL,
   secret scanning et dependency review, la résolution des conversations et
   l'interdiction du force-push et de la suppression.
3. Activer CodeQL, secret scanning avec push protection, alertes de
   vulnérabilités et Dependabot ; traiter toute alerte critique ou élevée avant
   lancement.
4. Restreindre les Actions autorisées aux éditeurs nécessaires et imposer
   l'épinglage SHA lorsque l'offre le permet.
5. Publier la branche, laisser chaque nouveau workflow réussir au moins une
   fois et conserver ses preuves pendant 30 jours.
6. Vérifier le cron Vercel et son watchdog en Production avant de désactiver
   l'ancien scheduler GitHub. Ne jamais laisser les deux ordonnanceurs actifs
   simultanément après l'ouverture publique.
7. Désactiver puis supprimer le workflow GitHub historique uniquement pendant
   la bascule planifiée, après preuve du nouveau scheduler.

## Décision

La configuration locale est durcie, mais la gate GitHub Production reste
fermée : le dépôt distant n'a ni protection de branche, ni ruleset, ni services
de détection GitHub actifs, et les nouveaux workflows ne sont pas encore
publiés. Aucun réglage distant n'a été modifié pendant cet audit.
