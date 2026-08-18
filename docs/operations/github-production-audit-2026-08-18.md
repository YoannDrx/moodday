# Audit GitHub de préparation Production — 18 août 2026

Périmètre : métadonnées du dépôt `YoannDrx/moodday`, visibilité, protections
de branche, permissions Actions, services de sécurité, analyses CodeQL,
Dependabot et scans Gitleaks locaux. Aucun secret en clair n'a été lu ou
consigné.

## Changement de situation

Le dépôt, privé lors de l'audit du 14 août, est désormais **public**. Sa
dernière mise à jour de métadonnées est datée du 18 août, tandis que le dernier
push sur `main` reste daté du 10 août. Cette visibilité ne correspond pas à la
cible du plan, qui exige un dépôt privé dans une organisation capable de
maintenir CodeQL et Secret Protection.

La visibilité n'a pas été modifiée pendant cet audit. Le retour au privé reste
une décision externe, car il exige de vérifier au préalable l'offre et les
fonctionnalités GitHub qui resteraient disponibles.

## Protections activées

Les protections réversibles suivantes ont été activées le 18 août :

- secret scanning ;
- push protection ;
- alertes de vulnérabilités ;
- Dependabot Security Updates et correctifs automatisés ;
- CodeQL par défaut avec la suite `extended` et le modèle de menace
  `remote_and_local` ;
- protection intermédiaire de `main` : passage par pull request, application
  aux administrateurs, révocation des reviews obsolètes, historique linéaire,
  résolution des conversations, interdiction du force-push et de la
  suppression.

Le premier run CodeQL a terminé avec succès pour `actions` et
`javascript-typescript`. Les contrôles obligatoires ne sont pas encore attachés
à la protection de branche : les noms définitifs des nouveaux jobs n'existeront
sur GitHub qu'après publication contrôlée de la branche.

## Alertes révélées sur l'ancien `main`

Le premier scan a ouvert 21 alertes CodeQL :

- 2 critiques de type request forgery dans le chargement des polices Open Graph ;
- 7 hautes : liens d'e-mail insuffisamment bornés et courses de fichiers dans
  les scripts d'initialisation du boilerplate ;
- 12 moyennes : redirections d'e-mail, Actions non épinglées et permissions de
  workflow trop larges.

Le worktree corrige ces causes :

- les polices Open Graph sont lues depuis deux chemins locaux constants ;
- les e-mails utilisent exclusivement l'origine HTTPS canonique Moodday ;
- les e-mails de facture n'acceptent plus de destination fournisseur et
  renvoient exclusivement vers la page de facturation Moodday canonique ;
- les scripts d'initialisation génériques et leurs écritures de secrets sont
  supprimés ;
- les Actions sont épinglées à des SHA immuables, les permissions sont
  minimales et CodeQL local utilise `security-extended`.

Ces alertes ne pourront être fermées par une preuve GitHub qu'après publication
de la branche et nouveau scan. Elles ne sont donc pas marquées résolues dans le
registre distant.

Dependabot recense 223 alertes historiques sur le lockfile de l'ancien `main`,
dont 199 ouvertes : 5 critiques, 104 hautes, 72 moyennes et 18 basses. Une PR
automatique propose notamment une version de Next inférieure à la version
16.3.0 déjà présente dans le worktree ; elle ne doit pas être fusionnée. Le
worktree courant passe la porte `pnpm audit:all`. Tous les avis élevés
corrigibles de l'outillage ont été mis à niveau ; l'unique CVE sans release
amont corrigée (`CVE-2026-56876`) est couverte par un patch pnpm et un test
d'exploitation bloquant avant son exception d'audit ciblée.

## Scans de secrets

Gitleaks 8.30.1 a été exécuté avec redaction :

- 72 commits et environ 9,31 Mo d'historique scannés ;
- 15 faux positifs historiques du boilerplate neutralisés uniquement par leur
  fingerprint exact dans `.gitleaksignore` ;
- tous les répertoires applicatifs, tests, workflows, migrations et fichiers de
  configuration versionnables du worktree rescannés ;
- résultat final : aucune fuite détectée.

Les fichiers `.env`, `.env.test` et `.env.local` contiennent des secrets locaux,
mais sont tous ignorés et ne sont pas présents dans l'historique Git. Ils restent
néanmoins concernés par la rotation déclenchée après l'incident Preview Vercel.

Le workflow Gitleaks fixe désormais explicitement la version 8.30.1. Les secrets
de test statiques ont été remplacés par des valeurs éphémères propres à chaque
run. Le téléchargement CI de `wait-on@latest` a également été remplacé par
`wait-on@9.1.0` verrouillé dans le lockfile ; un test interdit désormais `npx`,
`pnpm dlx` et `@latest` dans les workflows.

## État restant

| Contrôle                           | État au 18 août                                      | Porte                                            |
| ---------------------------------- | ---------------------------------------------------- | ------------------------------------------------ |
| Visibilité                         | public, contrairement à la cible privée              | rouge                                            |
| Protection `main`                  | PR et protections structurelles actives              | partielle                                        |
| Checks obligatoires                | aucun check attaché                                  | rouge                                            |
| CodeQL                             | activé, premier run réussi, 21 alertes ancien `main` | rouge jusqu'au rescan de la branche              |
| Secret scanning/push protection    | activés                                              | comptage des alertes fournisseur à confirmer     |
| Signalement privé de vulnérabilité | activé                                               | vert                                             |
| Dependabot                         | activé, ancien `main` très en retard                 | rouge jusqu'à la publication du lockfile courant |
| Actions autorisées                 | GitHub, pnpm et Gitleaks uniquement                  | vert                                             |
| Épinglage SHA plateforme           | exigé par GitHub et contrôle local actif             | vert                                             |
| Ancien scheduler                   | toujours actif et en échec répété                    | rouge                                            |

## Conditions de sortie

1. Décider et exécuter le retour du dépôt dans une organisation privée avec
   Code Security et Secret Protection maintenus.
2. Publier la branche uniquement après rotation des secrets et passage de
   `verify:vercel-predeploy`.
3. Laisser qualité, cinq matrices Playwright, dependency review, CodeQL étendu
   et Gitleaks réussir sur la PR.
4. Attacher ces checks exacts à `main`, avec mode strict.
5. Confirmer zéro alerte CodeQL critique/haute et zéro alerte Dependabot runtime
   critique/haute sur le commit candidat ; traiter ou documenter chaque alerte
   restante.
6. Restreindre les Actions aux éditeurs nécessaires et imposer les SHA au
   niveau plateforme lorsque l'offre le permet.
7. Désactiver l'ancien scheduler GitHub uniquement après preuve du cron et du
   watchdog Vercel en Production.

## Décision

La posture GitHub s'est améliorée matériellement, mais la gate Production reste
fermée. Le dépôt est public, les alertes reflètent encore l'ancien `main`, les
nouveaux workflows ne sont pas publiés et aucun check n'est obligatoire.
