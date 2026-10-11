# Exceptions d'audit des dépendances

`pnpm audit --prod --audit-level=high` bloque la CI. Les seules exceptions
acceptées sont listées dans `pnpm.auditConfig.ignoreCves` de `package.json` et
justifiées ici. Toute nouvelle exception exige une décision explicite du
propriétaire du produit.

| CVE              | Paquet               | Pourquoi l'exception                                                                                                                                                            | Sortie                                      |
| ---------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `CVE-2026-56876` | `extract-zip` 2.0.1  | Aucune version amont corrigée ; patch pnpm et test d'exploitation bloquant (`__tests__/supply-chain-patches.test.ts`).                                                          | Retirer dès qu'une version corrigée existe. |
| `CVE-2026-85393` | `node-forge` ≤ 1.4.0 | Aucune version corrigée. Atteint uniquement via l'outillage Expo (`@expo/cli`), tiré par les peers optionnels de `@better-auth/expo`. Le serveur web ne l'exécute pas.          | Retirer dès qu'Expo ou node-forge corrige.  |
| `CVE-2026-93687` | `braces` ≤ 3.0.3     | Aucune version corrigée. Atteint uniquement via metro (`metro-file-map` → `micromatch`) dans l'outillage Expo ; motifs de glob fournis par le dépôt, jamais par un utilisateur. | Retirer dès qu'une version corrigée existe. |

Décision du 11 octobre 2026 : exceptions ciblées acceptées par Yoann pour
`node-forge` et `braces`. L'alerte `tinypool` a été résolue en passant à
Vitest 4, qui n'en dépend plus.
