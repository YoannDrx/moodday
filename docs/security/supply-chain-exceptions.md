# Exceptions de sécurité de la chaîne de dépendances

Ce registre ne couvre que les avis qu'il est impossible de fermer par une mise
à jour amont compatible. Une exception doit être limitée à un avis précis,
compensée par un contrôle automatisé et retirée dès qu'une version corrigée est
disponible.

## `extract-zip` — GHSA-jmr9-qjv8-65gv

- **Portée :** dépendance de développement transitive, utilisée par l'outillage
  Expo ; elle n'est pas embarquée dans le runtime web de production.
- **État amont au 22 août 2026 :** aucune version corrigée n'est publiée pour
  `extract-zip` 2.0.1.
- **Mesure compensatoire :** le patch pnpm
  `patches/extract-zip@2.0.1.patch` refuse un lien symbolique dont la cible sort
  du répertoire d'extraction.
- **Preuve :** `__tests__/supply-chain-patches.test.ts` rejoue une archive
  malveillante et vérifie qu'aucun fichier n'est créé hors de la destination.
- **Garde CI :** la revue des dépendances n'autorise que cet identifiant GHSA ;
  le test du patch est exécuté par la gate qualité et par `pnpm audit:all`.
- **Responsable :** Engineering Mood Day.
- **Prochaine revue :** à chaque mise à jour Expo, ou au plus tard le
  22 septembre 2026.
- **Critère de sortie :** supprimer le patch, l'exception CI et l'ignore CVE dès
  qu'Expo résout une version d'`extract-zip` corrigée, puis rejouer toute la gate
  de livraison mobile.

## Alertes fermées dans le lockfile

Les autres avis visibles le 22 août 2026 ne font pas l'objet d'une exception :

- Valibot est fixé à 1.4.2, dans la plage pair supportée par `@t3-oss/env-core` ;
- le plugin React de Vite est fixé à 5.2.0 et résout Babel Core 7.29.7 ;
- les deux versions transitives de `uuid` sont remplacées par 11.1.1. Expo
  `xcode` et Lighthouse n'utilisent que `v4()`, compatibilité rejouée par test.

Toute réapparition des versions vulnérables dans `pnpm-lock.yaml` fait échouer
le test de chaîne de dépendances.
