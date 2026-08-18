# Procédure d'incident Moodday

## Déclenchement

Ouvrir un incident pour : accès non autorisé, secret exposé, contenu de santé
dans un log, dérive Stripe/base, échec répété de suppression/export, perte de
données ou indisponibilité des rappels.

## Réponse

1. Nommer un incident commander et horodater le début.
2. Contenir sans effacer les preuves : désactiver le kill switch concerné,
   révoquer les accès compromis et préserver des journaux expurgés.
3. Identifier l'environnement, la période et le nombre de comptes concernés
   sans recopier le contenu de santé.
4. Restaurer le service depuis une version ou une sauvegarde vérifiée.
5. Faire qualifier les obligations de notification par le DPO/conseil ; ne pas
   improviser de communication juridique.
6. Informer les personnes avec un texte factuel validé lorsque requis.
7. Produire un post-mortem : cause, chronologie, impact, mesures et propriétaire.

## Kill switches

- IA : `AI_INSIGHTS_ENABLED=false` conserve le fallback déterministe.
- Paiement : `BILLING_ENABLED=false` coupe la création de Checkout sans retirer
  les droits déjà enregistrés.
- Cron : révoquer `CRON_SECRET`, en générer un nouveau et redéployer.
- OpenAI/Stripe/Resend : révoquer la clé dans le fournisseur, remplacer le
  secret dans chaque environnement, redéployer, puis vérifier les appels.

Ne jamais publier un payload webhook, une note, un symptôme, un traitement ou
un export dans le canal d'incident.
