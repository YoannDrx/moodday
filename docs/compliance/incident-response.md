# Procédure incidents et violations de données

Statut : **runbook technique prêt, responsables humains et exercice Production à signer**

Point d'entrée interne : responsable du traitement Yodev. Contact vie privée
public : `hello@moodday.app`. Ce document ne doit contenir ni donnée utilisateur,
ni token, ni secret, ni copie de contenu de santé.

## Déclenchement immédiat

Tout signal de perte de confidentialité, d'intégrité ou de disponibilité d'une
donnée personnelle ouvre un incident, même si son origine est un fournisseur.
L'heure de « connaissance raisonnable » est enregistrée : elle démarre le délai
de notification. La personne qui découvre l'incident :

1. conserve les preuves techniques sans dupliquer les données sensibles ;
2. révoque ou isole les accès compromis dans le périmètre autorisé ;
3. active la maintenance et les kill switches Billing, IA, aidants et push si
   le confinement l'exige ;
4. prévient immédiatement le responsable du traitement ;
5. ne communique publiquement aucun détail non validé.

## Triage et confinement

- Classer l'événement : confidentialité, intégrité, disponibilité, mauvais
  destinataire, mélange multi-comptes, suppression incorrecte ou fournisseur.
- Identifier les catégories et nombres approximatifs de personnes et
  d'enregistrements, les dates, environnements et sous-traitants concernés.
- Examiner en priorité les données de santé, identifiants, MFA, exports,
  notifications, aidants, Stripe et sorties IA.
- Conserver release, request IDs, états de jobs et journaux techniques ; ne pas
  exporter librement les notes ou payloads.
- Appliquer le rollback documenté seulement après protection de l'intégrité des
  preuves et de la base.

## Décision RGPD

Toute violation est inscrite au registre interne avec nature, périmètre,
conséquences probables, mesures prises et justification du niveau de risque.

- Aucun risque pour les personnes : documentation interne, sans notification.
- Risque : notification CNIL dans les meilleurs délais et si possible sous
  72 heures après connaissance.
- Risque élevé : notification CNIL et information claire des personnes dans les
  meilleurs délais, sauf exception juridiquement validée.

Si l'enquête n'est pas terminée, effectuer une notification initiale puis une
notification complémentaire. Tout dépassement de 72 heures doit être motivé.
La décision appartient au responsable du traitement assisté de son conseil ;
elle ne doit jamais être automatisée par Moodday.

## Contenu minimal du registre

- identifiant interne et chronologie UTC/Europe-Paris ;
- nature de la violation ;
- catégories et volumes approximatifs de personnes et données ;
- conséquences probables et évaluation gravité/probabilité ;
- mesures de confinement, correction et prévention ;
- décision CNIL/personnes et justification ;
- notifications initiale et complémentaire ;
- date de rétablissement et validation de fermeture.

## Répétition avant lancement

Exercer au minimum : fuite multi-comptes, notification au mauvais appareil,
export DSAR compromis, clé fournisseur exposée, restauration incorrecte et
webhook rejoué. Chronométrer détection, kill switches, qualification, brouillon
CNIL, information utilisateur, restauration et retour à la normale.

Références : [règles CNIL](https://cnil.fr/fr/violations-de-donnees-personnelles-les-regles-suivre),
[téléservice et contenu attendu](https://www.cnil.fr/fr/services-en-ligne/notifier-une-violation-de-donnees-personnelles),
[gestion des incidents](https://www.cnil.fr/fr/securite-gerer-les-incidents-et-les-violations).
