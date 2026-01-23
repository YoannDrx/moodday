---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - "_bmad-output/analysis/brainstorming-session-2026-01-20.md"
  - "chatgpt-context (user-provided)"
date: 2026-01-20
author: Yoannandrieux
---

# Product Brief: Moodday

## Implementation Status (2026-01-23)

See `PROJECT_STATUS.md` for the current build audit. MVP scope is **largely implemented**; remaining gaps: push notifications serveur et sync offline complet.

## Executive Summary

**Moodday** est un journal clinique-friendly (PWA) conçu pour les personnes vivant avec des troubles psychiatriques (TDAH, bipolarité, dépression, anxiété) ou suivant une psychothérapie. L'application répond à deux questions fondamentales:

- **"Mon traitement médicamenteux fonctionne-t-il ?"**
- **"Ce que je teste avec mon psy, ça m'aide vraiment ?"**

Moodday se positionne comme **le témoin objectif et bienveillant** + **le carnet de psy qu'on aurait dû avoir depuis le début** - une béquille mémoire fiable qui valide la réalité quand le cerveau ment, prolonge le travail thérapeutique entre les séances, et accompagne l'utilisateur dans ses consultations avec des données concrètes et visuelles.

---

## Core Vision

### Problem Statement

Les personnes sous traitement psychiatrique ou en psychothérapie font face à un problème d'**attribution causale**: avec la psychothérapie, les médicaments (parfois multiples avec des ajustements fréquents), les exercices à appliquer, et les variations naturelles de l'humeur, il devient impossible de savoir **ce qui fonctionne vraiment**.

> "Je ne savais plus ce qui était bénéfique" — Citation clé du brainstorming

Ce problème est amplifié par:
- La difficulté d'introspection inhérente aux troubles psychiatriques
- L'oubli des mauvaises actions et des phases difficiles
- L'oubli de ce que le psy a dit en séance
- Le manque de données objectives lors des consultations
- La méthode actuelle (carnet/stylo) qui ne permet aucune analyse

### Problem Impact

Sans outil adapté:
- Les patients arrivent en consultation sans données, se basant sur leur mémoire défaillante
- Les ajustements de traitement se font à l'aveugle
- Le travail thérapeutique s'arrête à la porte du cabinet
- Les exercices du psy sont oubliés ou mal appliqués
- Les proches servent de "miroir" mais sans structure pour leurs observations
- Le protocole d'isolation (arrêter tout, réintégrer un par un) reste la seule méthode fiable mais extrêmement longue

### Why Existing Solutions Fall Short

Les applications de suivi d'humeur actuelles échouent sur plusieurs points:
- **UX non adaptée**: Trop de friction, trop de pression → abandon rapide
- **Streak guilt**: Culpabilisation si l'utilisateur rate un jour (particulièrement toxique pour cette population)
- **Pas de corrélation traitement/humeur**: Les apps traquent l'humeur mais pas les médicaments et leurs dosages
- **Pas de suivi thérapie**: Aucun espace pour noter les exercices du psy et leur efficacité
- **Pas d'export clinique**: Impossible de montrer des données exploitables au psy
- **Ton inapproprié**: Messages qui peuvent stresser ou culpabiliser une population déjà fragile

### Proposed Solution

Moodday propose un **compagnon de thérapie complet** avec un cycle autour de chaque séance:

**AVANT la séance:**
- Données humeur et patterns à montrer
- Questions à poser
- Export PDF pour le psy

**APRÈS la séance:**
- Notes de compréhension
- Ce qu'on a retenu
- Exercices à appliquer
- Pourquoi/comment

**ENTRE les séances:**
- Tracker humeur quotidienne (<30 sec)
- Médicaments pris + dosages
- Exercices testés → bénéfique ou non ?
- Observations de vie

### Key Differentiators

| Aspect | Concurrent Type | Moodday |
|--------|-----------------|---------|
| **Focus** | Bien-être général | Suivi clinique psychiatrique + thérapeutique |
| **Corrélation** | Humeur seule | Humeur ↔ Médicaments ↔ Exercices psy ↔ Événements |
| **Ton** | Gamification/streaks | Bienveillance sans pression |
| **Cycle thérapie** | Inexistant | Avant/Pendant/Après séance |
| **Output** | Données brutes | PDF optimisé consultation |
| **Utilisateur** | Grand public | Patient + Psy/Psychiatre en duo |

**Valeur unique:**
- Quand le cerveau ment, l'app dit la vérité
- Quand la mémoire flanche, l'app se souvient
- Quand la séance est finie, l'app prolonge le travail

---

## Target Users

### Primary Users

#### Persona 1: Marie, 34 ans — "La patiente multi-suivis"

**Contexte:**
Marie est en arrêt maladie depuis 6 mois suite à un burn-out qui a révélé un trouble bipolaire. Elle voit un psychiatre (1x/mois pour les médicaments) ET une psychologue (1x/semaine pour la thérapie). Elle prend 3 médicaments dont les dosages changent régulièrement.

**Son problème:**
- Elle ne sait plus si c'est la lamotrigine à 150mg ou le travail avec sa psy sur les limites qui l'aide
- Elle oublie ce que sa psy lui a dit entre les séances
- Elle arrive en consultation en disant "ça va mieux... je crois ?"
- Son psychiatre et sa psychologue ne sont pas toujours d'accord

**Ce qu'elle veut:**
- Savoir CE QUI fonctionne vraiment pour elle
- Arriver préparée chez le psy avec des données concrètes
- Ne pas oublier les exercices à faire entre les séances

#### Persona 2: Lucas, 28 ans — "Le thérapie-only"

**Contexte:**
Lucas suit une thérapie pour anxiété sociale depuis 1 an. Pas de médicaments. Son psy lui donne des exercices d'exposition progressive à faire dans sa vie quotidienne.

**Son problème:**
- Il oublie d'appliquer les techniques quand il est dans le feu de l'action
- Il ne sait pas si les exercices "marchent" vraiment ou si c'est le temps qui passe
- Il arrive en séance en mode "euh... ça s'est bien passé je crois"

**Ce qu'il veut:**
- Noter ses "victoires" et "échecs" d'exposition
- Voir sa progression sur le long terme
- Préparer ses séances avec des exemples concrets

### Secondary Users

#### Persona 3: Sophie, 45 ans — "L'aidante proche"

**Contexte:**
Sophie est la compagne de quelqu'un avec un trouble bipolaire. Elle voit les signes avant-coureurs de phases dépressives/maniaques avant lui.

**Son rôle:**
- Observer et noter des signaux que le patient ne voit pas
- Être alertée si ça va mal pour être plus présente
- Pas surveiller, mais RASSURER et AIDER

#### Persona 4: Dr. Benoit — "Le psychiatre"

**Contexte:**
Psychiatre en libéral, il voit ses patients 20-30 min par mois. Il ajuste les traitements mais manque de données objectives entre les consultations.

**Ce qu'il veut:**
- Des données visuelles claires (pas un roman)
- Voir la corrélation entre changements de dosage et humeur
- Un PDF qu'il peut parcourir en 2 minutes

### User Journey (Marie)

| Étape | Description |
|-------|-------------|
| **Découverte** | Recommandation de sa psy qui cherchait un outil adapté |
| **Onboarding (5 min)** | Configure ses 3 médicaments + dosages actuels. Ton bienveillant: "Pas de pression, prends ton temps" |
| **Usage quotidien (<30 sec)** | Notification douce le soir. Slider humeur + "Médicaments pris ?" + note optionnelle |
| **Après séance psy** | Note ce qu'elle a compris. Exercice à tester cette semaine |
| **Aha Moment (semaine 3)** | "Depuis que j'ai augmenté le Lamictal, la courbe monte". "Le fait que ce soit noté, ça devient VRAI" |
| **Consultation psychiatre** | Ouvre l'app, montre le PDF. Discussion basée sur des faits, pas des souvenirs flous |

---

## Success Metrics

### User Success Metrics

#### Pour Marie (patiente multi-suivis)

| Métrique | Indicateur de succès |
|----------|---------------------|
| **Constance tracking** | ≥4 check-ins humeur/semaine (pas 7 - bienveillance!) |
| **Utilisation cycle séance** | Note post-séance dans les 24h après RDV psy |
| **Export PDF** | ≥1 PDF généré avant consultation psychiatre |
| **Aha moment** | Première corrélation médicament↔humeur identifiée (< 4 semaines) |

#### Pour Lucas (thérapie-only)

| Métrique | Indicateur de succès |
|----------|---------------------|
| **Exercices trackés** | ≥2 exercices psy notés/semaine |
| **Évaluation efficacité** | Note "bénéfique/neutre/négatif" sur 80% des exercices |
| **Préparation séance** | Consultation des données avant RDV (< 24h avant) |

#### Moment "Worth It"

> L'utilisateur sait que Moodday fonctionne quand il arrive en séance et dit: **"Cette semaine j'ai testé X, voici ce que j'ai observé..."** au lieu de **"Euh... ça va je crois."**

### Business Objectives

#### À 3 mois (MVP)
- **500 utilisateurs actifs** (≥1 check-in/semaine)
- **Validation product-market fit**: NPS ≥ 40 sur early adopters
- **Rétention J30**: ≥ 40% (difficile dans cette catégorie d'apps)

#### À 12 mois
- **10 000 utilisateurs actifs**
- **Conversion premium**: 5% des utilisateurs sur plan payant
- **Recommandation pro**: ≥50 psys/psychiatres recommandent l'app

### Key Performance Indicators

| KPI | Cible | Mesure |
|-----|-------|--------|
| **DAU/MAU** | ≥ 30% | Ratio utilisateurs actifs quotidiens/mensuels |
| **Rétention J7** | ≥ 60% | % utilisateurs revenus après 7 jours |
| **Rétention J30** | ≥ 40% | % utilisateurs revenus après 30 jours |
| **Check-ins/semaine** | ≥ 4 | Moyenne par utilisateur actif |
| **Time-to-value** | < 14 jours | Temps jusqu'au premier "aha moment" |
| **PDF exports/mois** | ≥ 1 par user actif | Preuve d'utilisation clinique |
| **NPS** | ≥ 40 | Net Promoter Score |

### North Star Metric

> **"Consultations préparées"** = Nombre d'utilisateurs ayant consulté leurs données ou généré un PDF dans les 48h précédant un RDV médical noté dans l'app.

Cette métrique capture la valeur core: Moodday aide à préparer les consultations.

---

## MVP Scope

### Core Features

| Feature | Description | Justification |
|---------|-------------|---------------|
| **Quick Mood Check** | Slider humeur 0-10 + note optionnelle (<30 sec) | Core loop quotidien |
| **Medication Tracker** | Liste médicaments + dosages + "pris aujourd'hui ?" | Corrélation traitement↔humeur |
| **Therapy Notes** | Notes post-séance psy + exercices à tester | Carnet de psy |
| **Exercise Tracker** | Exercices du psy + évaluation "bénéfique/neutre/négatif" | Suivi thérapeutique |
| **Timeline Courbe 30j** | Graphe humeur + marqueurs dosage + marqueurs séances | Visualisation patterns |
| **Export PDF** | PDF 1 page pour consultation | Valeur clinique immédiate |
| **Onboarding bienveillant** | Setup médicaments + ton rassurant | Première impression |

### Screens MVP (10-12)

1. Landing/Marketing
2. Sign Up / Login
3. Onboarding (3 sous-étapes)
4. Dashboard (hub central)
5. Quick Entry Modal (humeur + meds)
6. Medication List
7. Add/Edit Medication
8. Therapy Notes (post-séance)
9. Exercise List + Add
10. Courbe 30j
11. Export PDF
12. Settings

### Out of Scope for MVP

| Feature | Pourquoi reporté | Version cible |
|---------|------------------|---------------|
| **Système Aidants** | Complexité permissions + notifications | V1 |
| **Tracking Énergie/Sommeil** | Focus sur humeur + meds d'abord | V1 |
| **Tags Événements** | Nice-to-have, pas essentiel | V1 |
| **Scanner Ordonnance** | Complexité OCR | V1 |
| **Corrélations IA** | Besoin de data d'abord | V2 |
| **Intégration Strava/Health** | Signaux passifs = V2 | V2 |
| **Calendrier séances psy** | Synchro calendrier complexe | V1 |
| **Mode Pro (psychiatre)** | Focus patient d'abord | V2 |

### MVP Success Criteria

**Go/No-Go à 3 mois:**

| Critère | Seuil de validation |
|---------|---------------------|
| **Utilisateurs actifs** | ≥ 300 (≥1 check-in/semaine) |
| **Rétention J30** | ≥ 35% |
| **NPS early adopters** | ≥ 30 |
| **PDF exports** | ≥ 50 exports générés |
| **Feedback qualitatif** | ≥ 10 témoignages "ça m'a aidé en consultation" |

**Signal fort de PMF:**
> Un utilisateur dit: "J'ai montré le PDF à mon psychiatre, on a pu voir que depuis le changement de dosage ça allait mieux."

### Future Vision

#### V1 (Post-MVP, +2-3 mois)
- Système Aidants avec permissions granulaires
- Tracking énergie + sommeil
- Tags événements personnalisés
- Calendrier des RDV psy intégré
- Notifications rappel séance

#### V2 (+6 mois)
- IA détection patterns (sans diagnostic)
- Signaux passifs (Strava, Apple Health)
- Mode Pro pour psychiatres
- Corrélations multi-variables automatiques

#### Vision 2 ans
- Moodday devient le standard pour le suivi psychiatrique/thérapeutique
- Recommandé par les psychiatres à leurs patients
- Intégration possible avec logiciels médicaux (Doctolib, etc.)
- Études cliniques sur l'efficacité du self-tracking
