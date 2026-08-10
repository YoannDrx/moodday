# AIPD — registre de préparation

Statut : **gate ouverte, validation juridique requise**

Propriétaire pressenti : Direction / DPO à désigner

Dernière revue technique : 2026-08-07

Ce document n'est pas une AIPD validée. Il réunit les éléments techniques à
faire examiner avant d'ouvrir l'IA, le partage aidant étendu ou une intégration
de données de santé.

## Traitements à évaluer

| Traitement             | Données                                           | Finalité                                   | Sous-traitants possibles             | Gate                                                        |
| ---------------------- | ------------------------------------------------- | ------------------------------------------ | ------------------------------------ | ----------------------------------------------------------- |
| Journal et check-in    | humeur, sommeil, anxiété, énergie, notes          | suivi personnel                            | Vercel, Neon, Redis/Blob selon usage | Contrats, régions et durées confirmés                       |
| Traitements et rappels | nom, dosage déclaré, horaires, prises             | aide-mémoire personnel                     | Vercel, Neon, fournisseur push       | Fiabilité et contenu des notifications validés              |
| Bilan IA               | agrégats minimisés, notes sur double consentement | synthèse factuelle non médicale            | OpenAI                               | DPA/transferts, corpus d'évaluation et consentement validés |
| Cercle aidant          | catégories et périodes choisies                   | partage contrôlé par l'utilisateur         | Vercel, Neon, email                  | IDOR/E2E, audit d'accès et downgrade validés                |
| Exports                | données choisies par l'utilisateur                | portabilité et préparation de consultation | Blob uniquement si activé            | URL, durée, chiffrement et suppression validés              |

## Risques et mesures déjà codées

- Surinterprétation médicale : prompt non médical, sortie structurée, preuves
  obligatoires, fallback déterministe et kill switch.
- Exposition de notes : exclusion par défaut et double consentement pour les
  inclure dans un bilan IA.
- Accès non autorisé : contrôles serveur, permissions aidant et révocation.
- Facturation erronée : Price IDs en allowlist, catalogue vérifié et webhook
  idempotent.
- Transfert non maîtrisé : aucune promesse d'hébergement exclusivement européen
  tant que chaque fournisseur, failover et stockage n'est pas documenté.
- Crise : détection déterministe et modération, puis affichage du 3114 et du
  15/112 en France ; Moodday n'est pas un service d'urgence.

## Décisions écrites attendues

- Qualification des données et base légale de chaque traitement.
- Nécessité d'une AIPD formelle et validation de sa version finale.
- Rôles responsable/sous-traitant, DPA et mécanismes de transfert.
- Durées de conservation réelles, y compris sauvegardes et journaux.
- Applicabilité HDS et règlement relatif aux dispositifs médicaux.
- Âge minimal, consentement, retrait et information des aidants.

Tant que ces décisions ne sont pas signées, `AI_INSIGHTS_ENABLED` et les
fonctionnalités concernées restent désactivés en production.
