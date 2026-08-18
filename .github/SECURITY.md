# Politique de sécurité Moodday

## Versions prises en charge

Moodday n'est pas encore ouvert au public. Après le lancement, seule la version
actuellement déployée en Production sera prise en charge. Les branches, previews
et copies locales ne constituent pas des services de Production.

## Signaler une vulnérabilité

Utilisez le
[signalement privé GitHub](https://github.com/YoannDrx/moodday/security/advisories/new)
afin de ne pas divulguer publiquement le problème. Indiquez, avec des données
synthétiques uniquement :

- la catégorie et l'impact potentiel ;
- les prérequis et les étapes minimales de reproduction ;
- les routes ou versions concernées ;
- une proposition de correction, si vous en avez une.

N'incluez jamais de donnée de santé réelle, d'adresse e-mail d'un utilisateur,
de token, de cookie, de clé API ou de secret dans le rapport. Si une preuve doit
être transmise, remplacez toutes les valeurs par des sentinelles synthétiques.

## Cadre de test

- Utilisez uniquement vos propres comptes et des données fictives.
- N'accédez pas aux données d'une autre personne et ne les modifiez pas.
- N'effectuez pas de déni de service, de test de charge non autorisé, de
  phishing, d'ingénierie sociale ou de perturbation des fournisseurs.
- Interrompez le test dès qu'une séparation de comptes ou un secret pourrait
  être compromis, puis utilisez le canal privé ci-dessus.
- Ne publiez pas le problème avant qu'une correction et un délai de déploiement
  raisonnable aient été convenus.

Nous visons un accusé de réception sous trois jours ouvrés. Ce délai est un
objectif opérationnel et non une garantie contractuelle. Les vulnérabilités
affectant l'isolation des comptes, les secrets, la suppression des données, la
facturation ou les parcours de sécurité liés à la santé sont traitées en
priorité.

---

## English summary

Moodday is not publicly launched yet; after launch, only the currently deployed
Production version will be supported. Report vulnerabilities through
[GitHub private vulnerability reporting](https://github.com/YoannDrx/moodday/security/advisories/new).

Use only accounts you own and synthetic data. Never include real health data,
user email addresses, tokens, cookies, API keys, or secrets in a report. Do not
access another person's data, perform denial-of-service or unauthorized load
testing, use social engineering, or disrupt a provider. Stop testing as soon as
account isolation or a secret may be affected and report the issue privately.

We aim to acknowledge reports within three business days; this is an
operational target, not a contractual guarantee. Account isolation, secrets,
data deletion, billing, and health-safety paths receive priority.
