# AIPD — registre de préparation

Statut : **AIPD retenue par prudence pour la release, validation du responsable et revue juridique requises**

Responsable de validation : Yodev, responsable du traitement. Contact vie
privée : `hello@moodday.app`. La nécessité de désigner formellement un DPO reste
une décision documentée à prendre.

Dernière revue technique : 2026-08-13

Ce document n'est pas une AIPD validée. Il réunit les éléments techniques à
faire examiner avant d'ouvrir le service. Moodday combine au minimum des
données sensibles et un usage innovant facultatif avec IA ; l'équipe choisit
donc de mener une AIPD complète sans attendre qu'un seuil de grande échelle
soit atteint.

## Traitements à évaluer

| Traitement             | Données                                           | Finalité                                   | Sous-traitants possibles       | Gate                                                        |
| ---------------------- | ------------------------------------------------- | ------------------------------------------ | ------------------------------ | ----------------------------------------------------------- |
| Journal et check-in    | humeur, sommeil, anxiété, énergie, notes          | suivi personnel                            | Vercel, Neon, Blob selon usage | Contrats, régions et durées confirmés                       |
| Traitements et rappels | nom, dosage déclaré, horaires, prises             | aide-mémoire personnel                     | Vercel, Neon, fournisseur push | Fiabilité et contenu des notifications validés              |
| Bilan IA               | agrégats minimisés, notes sur double consentement | synthèse factuelle non médicale            | OpenAI                         | DPA/transferts, corpus d'évaluation et consentement validés |
| Cercle aidant          | catégories et périodes choisies                   | partage contrôlé par l'utilisateur         | Vercel, Neon, email            | IDOR/E2E, audit d'accès et downgrade validés                |
| Exports                | données choisies par l'utilisateur                | portabilité et préparation de consultation | Blob uniquement si activé      | URL, durée, chiffrement et suppression validés              |

Le registre détaillé des finalités, bases candidates, destinataires et durées
est maintenu dans [processing-register.md](./processing-register.md). L'analyse
d'applicabilité HDS est séparée dans [hds-assessment.md](./hds-assessment.md).

## Risques et mesures déjà codées

- Surinterprétation médicale : prompt non médical, sortie structurée, preuves
  obligatoires, fallback déterministe et kill switch.
- Exposition de notes : exclusion par défaut et double consentement pour les
  inclure dans un bilan IA.
- Traitement du journal sans exception à l'article 9 : consentement explicite
  `health_data`, versionné et distinct des CGU/confidentialité ; comptes
  historiques bloqués jusqu'à leur propre choix.
- Accès non autorisé : contrôles serveur, permissions aidant et révocation.
- Facturation erronée : Price IDs en allowlist, catalogue vérifié et webhook
  idempotent.
- Transfert non maîtrisé : aucune promesse d'hébergement exclusivement européen
  tant que chaque fournisseur, failover et stockage n'est pas documenté.
- Crise : détection déterministe et modération, puis affichage du 3114 et du
  15/112 en France ; Moodday n'est pas un service d'urgence.

## Décisions écrites attendues

- Signature des bases de l'article 6 et exceptions de l'article 9 pour chaque
  finalité, ainsi que les modalités de retrait du consentement indispensable.
- Validation de l'AIPD finale, des risques résiduels et du plan d'action.
- Rôles responsable/sous-traitant, DPA et mécanismes de transfert.
- Durées de conservation réelles, y compris sauvegardes et journaux.
- Applicabilité HDS et règlement relatif aux dispositifs médicaux.
- Âge minimal, consentement, retrait et information des aidants.

Tant que ces décisions ne sont pas signées, l'ouverture publique est interdite
et `AI_INSIGHTS_ENABLED`, `BILLING_ENABLED` et les fonctionnalités de partage
restent fermées.
