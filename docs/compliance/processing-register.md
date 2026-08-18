# Registre des traitements — Moodday France

Statut : **registre technique établi, qualification et bases à signer par le responsable du traitement**

Dernière revue technique : 13 août 2026

Responsable du traitement identifié : Yodev, entrepreneur individuel, SIREN
803 272 590. Point de contact vie privée : `hello@moodday.app`. L'adresse
postale professionnelle et la décision de désigner ou non un DPO restent des
portes de lancement explicites ; elles ne sont pas remplacées par ce registre.

Moodday traite des informations relatives à la santé mentale, aux traitements
et à la thérapie. Elles sont donc traitées comme des données sensibles. Le
produit demande désormais un consentement explicite, distinct des CGU et de la
politique de confidentialité, avant tout accès au journal. Aucun consentement
n'est fabriqué pour les comptes historiques.

## Inventaire

| Traitement                          | Personnes et données                                                 | Finalité                                                             | Base proposée et article 9                                                     | Destinataires                                               | Durée technique proposée                                                                    | Droits et contrôles                                                                           |
| ----------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Compte et authentification          | Adultes en France ; e-mail, nom facultatif, sessions, MFA, appareils | Créer et sécuriser le compte                                         | Contrat, art. 6.1.b ; intérêt légitime de sécurité, art. 6.1.f                 | Vercel, Neon, Resend, OAuth choisi                          | Vie du compte ; tokens selon leur expiration ; traces e-mail 90 jours                       | Accès, rectification, effacement, sessions révocables                                         |
| Journal personnel                   | Humeur, énergie, anxiété, sommeil, notes, tags                       | Fournir le journal, les tendances et exports demandés                | Contrat, art. 6.1.b ; consentement explicite, art. 9.2.a                       | Vercel, Neon                                                | Vie du compte ; suppression active visée sous 24 h ; sauvegardes par rotation sous 30 jours | Accès, rectification, portabilité, effacement, retrait entraînant l'arrêt du service concerné |
| Traitements et rappels              | Nom, dosage, planning, prises, stock déclaré                         | Aide-mémoire personnel sans conseil médical                          | Contrat, art. 6.1.b ; consentement explicite, art. 9.2.a                       | Vercel, Neon, fournisseur Web Push selon activation         | Vie du compte ; livraisons techniques 90 jours                                              | Correction/annulation auditée, export, effacement, push révocable par appareil                |
| Thérapie, exercices et consultation | Dates, notes facultatives, questions et événements choisis           | Préparation personnelle d'une consultation et suivi                  | Contrat, art. 6.1.b ; consentement explicite, art. 9.2.a                       | Vercel, Neon ; aucun envoi professionnel dans cette version | Vie du compte                                                                               | Accès, rectification, export, effacement                                                      |
| Cercle aidant                       | Permissions, périodes, agrégats, observations et événements          | Partage contrôlé choisi par le patient                               | Consentement, art. 6.1.a ; consentement explicite, art. 9.2.a à confirmer      | Aidant invité, Vercel, Neon, Resend                         | Relation archivée pendant la vie du compte patient ; logs d'accès 12 mois                   | Révocation immédiate, fenêtres 7/30/90 jours, historique d'accès                              |
| Insights IA                         | Métriques minimisées ; note seulement avec second consentement       | Générer un bilan factuel facultatif                                  | Consentement, art. 6.1.a ; consentement explicite, art. 9.2.a                  | OpenAI, Vercel, Neon pour l'usage sans contenu              | Aucun prompt ou résultat dans les logs ; usage sans contenu 12 mois                         | Double opt-in, désactivation, quota, fallback, `store=false`                                  |
| Facturation Plus                    | Client, abonnement, facture et statut de paiement                    | Vente, essai, facturation, comptabilité                              | Contrat, art. 6.1.b ; obligation légale, art. 6.1.c                            | Stripe, Vercel, Neon                                        | Pièces financières selon la durée légale française à confirmer comptablement                | Portail, annulation, factures, remboursement selon politique validée                          |
| Support et e-mails                  | E-mail et contenu volontaire du message                              | Répondre, vérifier et sécuriser le compte                            | Contrat ou intérêt légitime selon le message ; obligation légale si applicable | Resend, Vercel                                              | Traces de livraison 90 jours ; contenu support selon politique à signer                     | Accès, rectification, effacement selon obligations                                            |
| Sécurité et exploitation            | Request ID, code d'erreur, durée, référence HMAC                     | Disponibilité, prévention des abus, diagnostic sans contenu de santé | Intérêt légitime, art. 6.1.f ; obligation légale le cas échéant                | Vercel, Neon, Resend pour alertes déterministes             | Logs visés 30 jours ; jobs terminés 30 jours                                                | Minimisation, pseudonymisation, accès restreint                                               |
| Demandes de droits                  | Identité vérifiée, périmètre, export chiffré, références HMAC        | Répondre aux droits RGPD                                             | Obligation légale, art. 6.1.c                                                  | Personnel habilité, Vercel Blob privé si remise             | Blob 24 h maximum ; audit sans contenu 12 mois proposé                                      | Double revue, lien à usage unique, clé séparée, aucune navigation admin                       |

## Décisions qui bloquent l'ouverture

- validation écrite de chaque base de l'article 6 et exception de l'article 9 ;
- validation juridique du parcours proposé de retrait du consentement santé :
  suppression autonome du compte ou demande au contact vie privée, avec arrêt
  du traitement concerné et sans effet rétroactif ;
- validation des durées, notamment finance, support, comptes supprimés et
  contributions aidant archivées ;
- adresse professionnelle publiée et décision documentée sur la désignation
  d'un DPO ;
- mécanismes de transfert, DPA et sous-traitants ultérieurs de chaque fournisseur ;
- conclusion AIPD et HDS signée.

Le détail des autorités et preuves attendues est suivi dans le
[registre des approbations externes](./release-approvals.md).

Références officielles : [article 9 du RGPD](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre2),
[informations de l'article 13](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre3),
[durées de conservation](https://www.cnil.fr/fr/passer-laction/les-durees-de-conservation-des-donnees).
