---
description: Guide d'utilisation de BMAD-METHOD
---

# BMAD-METHOD - Guide rapide

BMAD = Breakthrough Method for Agile AI Driven Development

## Prérequis

BMAD doit être installé. Si ce n'est pas fait, lance `pnpm setup` et choisis d'installer BMAD, ou manuellement :

```bash
npx bmad-method@alpha install
```

## Démarrer un nouveau projet

1. **Initialiser** : Lance `*workflow-init` pour analyser ton projet
2. **PRD** : Lance `*prd` pour créer le Product Requirements Document
3. **Architecture** : Lance `*create-architecture` pour le design technique

## Workflow de développement

1. **Epics/Stories** : `*create-epics-and-stories`
2. **Sprint** : `*sprint-planning`
3. **Développement** : `*dev-story`
4. **Review** : `*code-review`

## Agents disponibles

| Agent | Rôle | Commande |
|-------|------|----------|
| Analyst | Analyse et recherche | `/analyst` |
| PM | Product Management | `/pm` |
| Architect | Architecture technique | `/architect` |
| UX Designer | Design UX/UI | `/ux-designer` |
| SM | Scrum Master | `/sm` |
| DEV | Développement | `/dev` |
| TEA | Test Architect | `/tea` |

## Commandes principales

| Commande | Description |
|----------|-------------|
| `*workflow-init` | Initialise BMAD, analyse le projet |
| `*prd` | Crée un Product Requirements Document |
| `*create-architecture` | Design l'architecture technique |
| `*create-epics-and-stories` | Génère epics et user stories |
| `*sprint-planning` | Planifie un sprint |
| `*dev-story` | Implémente une story |
| `*code-review` | Review de code |

## Bonnes pratiques

- **Un chat = Un workflow** : Commence toujours un nouveau chat pour chaque workflow
- **Contexte** : Fournis le maximum de contexte au démarrage
- **Itération** : N'hésite pas à itérer sur les outputs

## Structure des fichiers

- `_bmad/` - Configuration et agents (à committer)
- `_bmad-output/` - Artifacts générés (gitignored)

## Mise à jour

Pour mettre à jour BMAD vers la dernière version :

```bash
npx bmad-method@alpha install
```

## Documentation

- [BMAD GitHub](https://github.com/bmad-code-org/BMAD-METHOD)
- [Documentation officielle](https://docs.bmad-method.org/)
