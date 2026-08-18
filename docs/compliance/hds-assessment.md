# Analyse d'applicabilité HDS

Statut : **applicabilité probable à faire confirmer ; ouverture publique bloquée sans conclusion signée**

Dernière revue technique : 13 août 2026

## Faits techniques établis

- Moodday conserve pour le compte de l'utilisateur des informations sur son
  humeur, sa santé mentale, ses traitements et sa thérapie.
- Le stockage principal est PostgreSQL chez Neon ; l'application et ses logs
  techniques sont exploités sur Vercel ; certains exports chiffrés utilisent
  Vercel Blob.
- Moodday n'est pas un professionnel de santé, ne pose pas de diagnostic, ne
  prescrit rien et n'envoie rien automatiquement à un soignant.
- Le fait d'être un service non médical ne suffit pas, à lui seul, à exclure la
  qualification de données de santé ou le régime d'hébergement.

## Cadre à faire appliquer au périmètre réel

L'article L.1111-8 du Code de la santé publique vise l'hébergement numérique de
données de santé recueillies à l'occasion d'activités de prévention, de
diagnostic, de soins ou de suivi social/médico-social, y compris pour le compte
du patient lui-même. Lorsque ces conditions cumulatives sont réunies, le tiers
hébergeur doit être certifié HDS et un contrat d'hébergement est requis.

Depuis le 16 mai 2026, les certificats valides doivent relever du référentiel
HDS v2. La région d'exécution `fra1` ou une localisation européenne ne remplace
pas une certification HDS couvrant précisément les activités souscrites et la
chaîne de sous-traitance.

## Preuves à obtenir avant décision

1. Avis juridique écrit qualifiant l'activité personnelle de Moodday au regard
   de « prévention » et du recueil pour le compte du patient.
2. Cartographie des activités HDS applicables : mise à disposition et maintien
   en condition opérationnelle des sites, infrastructure matérielle, plateforme,
   infrastructure virtuelle, administration/exploitation et sauvegardes.
3. Certificats HDS v2 en cours de validité de chaque acteur couvrant réellement
   ces activités, annexes et sous-traitants inclus.
4. Contrats et DPA décrivant restitution, destruction, incidents, accès depuis
   un État tiers, localisation primaire, réplication, sauvegardes et support.
5. Conclusion signée indiquant soit le périmètre HDS retenu, soit les motifs
   juridiques précis d'une non-applicabilité.

Tant que ces preuves manquent, « conforme HDS », « hébergé HDS » et « hébergé
exclusivement en Europe » sont interdits dans le produit et le marketing.

Références : [article L1111-8](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049571347/2025-01-20),
[FAQ HDS de l'ANS](https://esante.gouv.fr/faq/quelles-sont-les-conditions-remplir-pour-heberger-des-donnees-de-sante-caractere-personnel),
[transition HDS v2](https://esante.gouv.fr/espace-presse/publication-au-journal-officiel-du-referentiel-de-certification-hds-souverainete-des-donnees-et-ameliorations-du-referentiel).
