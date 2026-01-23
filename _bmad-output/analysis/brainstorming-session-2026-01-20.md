---
stepsCompleted: [1]
inputDocuments: []
session_topic: "Cadre MVP Moodday - Exploration complète"
session_goals: "Clarifier le scope MVP, identifier les priorités, explorer tous les angles (features, UX, différenciation, GTM)"
selected_approach: ""
techniques_used: []
ideas_generated: []
context_file: ""
---

# Brainstorming Session - Moodday MVP

> **Status note (2026-01-22):** Implementation is in progress. See `PROJECT_STATUS.md` for current build status and remaining work.

**Facilitateur:** Yoannandrieux
**Date:** 2026-01-20

---

## Session Overview

**Topic:** Cadre MVP Moodday - Exploration complète

**Goals:**
- Clarifier le scope du MVP (quoi garder / quoi reporter)
- Identifier les vraies priorités utilisateur
- Explorer la différenciation vs concurrence
- Définir le parcours utilisateur idéal
- Réfléchir au go-to-market initial

### Contexte Projet

Moodday est un journal clinique-friendly (PWA) pour les personnes vivant avec des troubles psychiatriques (TDAH, bipolarité, dépression, anxiété).

**Features clés envisagées :**
- Suivi quotidien humeur (0-10) + énergie + sommeil
- Gestion médicamenteuse (régulier + PRN)
- Collaboration aidant/professionnel
- Export PDF pour consultations psy
- IA pour détecter les patterns

**Architecture planifiée :** 18 screens, 12 semaines de dev

---

## Technique Selection

**Approche:** Flow Progressif (Divergent → Convergent)
**Journey Design:** Développement systématique de l'exploration à l'action

**Techniques par Phase:**
- **Phase 1 - Exploration:** What If Scenarios + First Principles
- **Phase 2 - Pattern Recognition:** Mind Mapping + Six Thinking Hats
- **Phase 3 - Development:** SCAMPER + Resource Constraints
- **Phase 4 - Action Planning:** Decision Matrix + Priority Mapping

---

## Brainstorming Results

### 🌊 PHASE 1: EXPLORATION EXPANSIVE ✅

_40 idées générées_

#### Idées Brutes

| # | Idée / Insight |
|---|----------------|
| 1 | **Bienveillance absolue** - L'app ne doit JAMAIS stresser ou culpabiliser |
| 2 | **Utilisateur fragile** - Dépression, difficulté routine, manque motivation |
| 3 | **Question centrale** : "Mon traitement fonctionne-t-il ?" |
| 4 | **Suivi thérapie** - Notes de séances psy, était-ce bénéfique ? |
| 5 | **Outil 360** - Vision globale humeur + progression + alertes |
| 6 | **Simplicité radicale** - Pas de friction, pas de pression |
| 7 | **Données passives** - Connecter Strava/sport pour détecter signaux |
| 8 | **Détection patterns** - Arrêt sport = signal phase dépressive |
| 9 | **Aidants** - Proche invité peut voir + aider à monitorer |
| 10 | **Pas de "streak guilt"** - Si tu rates un jour, c'est OK |
| 11 | **Consultation augmentée** - Ouvrir l'app avec le psy, analyser ensemble |
| 12 | **Corrélation visuelle** - "Après augmentation Lamictal → humeur +/-" |
| 13 | **Timeline événements + dosages** - Tout sur un même graphe |
| 14 | **Béquille mémoire** - Pour ceux qui oublient ou ont du mal à organiser |
| 15 | **L'app = repère fiable** - Ancre stable dans le chaos mental |
| 16 | **Aidant ≠ contrôle** - C'est de la REASSURANCE, pas de la surveillance |
| 17 | **Aidant alerte** - Si ça va pas → être plus présent |
| 18 | **Aidant PROACTIF** - Peut renseigner des observations |
| 19 | **Observations aidant → courbes** - Intégrées dans l'analyse globale |
| 20 | **Signal : Skip notifications répétés** = désengagement = alerte |
| 21 | **Signaux personnalisés** - Chacun a SES indicateurs |
| 22 | **Aujourd'hui = carnet/stylo** - Méthode archaïque, pas d'analyse |
| 23 | **Les proches = miroir** - Retours des autres comme seul indicateur |
| 24 | **Peu d'introspection** - Difficile de s'écouter soi-même |
| 25 | **Signaux quotidiens** - Sortir ? Courses ? Corps actif ? |
| 26 | **LE PROBLÈME CORE : Trop de variables, le patient SE PERD** |
| 27 | **Multi-axes** - Psychothérapie + TDAH + Bipolarité = confusion |
| 28 | **Psy ≠ Psychiatre** - Pas toujours d'accord, patient au milieu |
| 29 | **"Je ne savais plus ce qui était bénéfique"** - Citation clé |
| 30 | **Protocole isolation** - Arrêter tout, réintégrer un par un |
| 31 | **Moodday = démêler les variables** - Voir l'impact de CHAQUE chose |
| 32 | **Friction : UX complexe** - Trop de boutons = abandon |
| 33 | **Friction : Courbe plate** - Pas de mouvement = décourageant |
| 34 | **L'essentiel : Direction** - Monte ou descend ? Vers la stabilité |
| 35 | **"Le fait que ce soit noté, ça devient VRAI"** - Citation clé ! |
| 36 | **Mémoire des mauvaises actions** - On oublie, l'app se souvient |
| 37 | **Validation de la réalité** - L'app rend les événements RÉELS |
| 38 | **Timeline visuelle datée** - Voir physiquement ce qui s'est passé |
| 39 | **Aha moment = "C'est écrit, donc c'est vrai"** |
| 40 | **Reprise sport visible → espoir** - Signal positif tangible |

#### Insights Clés Phase 1

> **Moodday = Le témoin objectif et bienveillant**
> - Quand le cerveau ment, l'app dit la vérité
> - Quand la mémoire flanche, l'app se souvient
> - Le vrai problème : ATTRIBUTION CAUSALE ("Qu'est-ce qui marche pour MOI ?")

---

### 🔍 PHASE 2: RECONNAISSANCE DES PATTERNS ✅

#### 7 Clusters Identifiés

| Cluster | Thème | Idées |
|---------|-------|-------|
| A | Philosophie & Ton | #1, #6, #10, #15, #32, #34, #35, #37, #39 |
| B | Utilisateur Cible | #2, #14, #24, #26, #27, #28, #29, #36 |
| C | Core - Tracking & Corrélation | #3, #5, #12, #13, #30, #31 |
| D | Aidants | #9, #16, #17, #18, #19, #23 |
| E | Signaux Passifs | #7, #8, #20, #21, #25 |
| F | Consultation Psy | #4, #11, #22, #38, #40 |
| G | UX / Anti-patterns | #6, #10, #32, #33 |

#### Priorisation

| Phase | Clusters | Contenu |
|-------|----------|---------|
| **MVP** | A, C, F, G | Tracking humeur/meds, timeline, export psy, UX bienveillante |
| **V1** | + D | Système aidants |
| **V2** | + E | Signaux passifs (Strava, etc.) |

---

### 🔧 PHASE 3: DÉVELOPPEMENT DES IDÉES ✅

#### 5 Concepts MVP Raffinés

1. **Quick Mood Check** - Saisie < 30 sec (slider 0-10 + meds + note)
2. **Medication Timeline** - Liste meds + historique changements dosage
3. **Courbe Intelligente** - Humeur 30j + marqueurs dosage + événements
4. **Export Consultation** - PDF 1 page pour montrer au psy
5. **Microcopy Bienveillant** - Ton qui ne culpabilise jamais

---

### 🎯 PHASE 4: PLAN D'ACTION ✅

#### Architecture MVP

```
MOODDAY MVP = 10 screens, 8 semaines

Saisie Rapide → Stockage → Analyse Visuelle → Export PDF
     │              │              │              │
Humeur 0-10    MoodEntry      Courbe 30j     PDF 1 page
Meds pris?     MedIntake      + marqueurs    consultation
Note libre     Medication
```

#### Screens MVP (10)

1. Landing
2. Sign Up
3. Onboarding
4. **Dashboard** (hub central)
5. **Quick Entry Modal**
6. **Medication List**
7. Add/Edit Medication
8. **Courbe 30j**
9. **Export PDF**
10. Settings

#### Roadmap 8 Semaines

| Semaine | Focus |
|---------|-------|
| S1-2 | Fondations (Auth, DB, Design System) |
| S3-4 | Core Meds (CRUD, timeline) |
| S5-6 | Core Mood (Quick entry, Dashboard, Courbe) |
| S7 | Export PDF |
| S8 | Polish (Microcopy, onboarding, tests) |

#### Ce qui est OUT du MVP

- Aidants → V1
- Énergie tracking → V1
- Tags événements → V1
- Scanner ordonnance → V1
- Corrélations IA → V2
- Intégration Strava → V2

---

## Résumé Exécutif

**MOODDAY MVP**

🎯 **Mission:** Répondre à "Mon traitement fonctionne-t-il ?"

👤 **Utilisateur:** Personne avec trouble psy qui veut SAVOIR et MONTRER à son psy

💎 **Valeur Unique:** "Le témoin objectif et bienveillant"
- Corrélation traitement ↔ humeur visible
- Timeline pour consultation psy
- Ton qui ne culpabilise JAMAIS

📱 **Scope:** 10 screens, 8 semaines

✅ **Validé le:** 2026-01-20
