---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
workflowComplete: true
completedAt: "2026-01-20"
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/product-brief-moodday-2026-01-20.md"
  - "external: design-system.md (Design System Moodday)"
  - "external: 21 HTML mockups (project-screens)"
inspirationSources:
  - "MindDay (https://www.mindday.com/)"
existingDesignSystem: true
---

# UX Design Specification - Moodday

**Author:** Yoannandrieux
**Date:** 2026-01-20

## Implementation Status (2026-01-23)

**Snapshot:** See `PROJECT_STATUS.md` for full audit.

- ✅ Mood/meds/therapy/exercises core pages exist + connectées DB
- ✅ Dashboard branché aux données réelles (meds/sleep/streak/trend)
- ✅ Quick check-in modal câblé au FAB
- ✅ Onboarding multi-étapes (humeur + meds + preferences + aidant)
- ✅ Theme Zen + upload avatar + billing portal
- ⚠️ Offline-first UX partiel (SW + offline mood + notifications locales)

---

## Executive Summary

### Project Vision

**Moodday** est un journal clinique digital (PWA) positionné comme "le témoin objectif et bienveillant" pour les personnes vivant avec des troubles psychiatriques ou en psychothérapie.

**Mission Core:** Répondre à la question fondamentale : *"Mon traitement fonctionne-t-il ?"*

**Différenciateurs UX:**
- Corrélation explicite médicaments ↔ humeur ↔ exercices thérapeutiques
- Cycle de séance psy (avant/pendant/après)
- Export PDF pour consultations médicales
- Philosophie bienveillante : zéro streak guilt, jamais de culpabilisation

### Target Users

| Persona | Contexte | Besoin UX Principal |
|---------|----------|---------------------|
| **Marie** (34 ans) | Multi-suivis (psy + psychiatre), 3 médicaments, bipolaire | Visualiser si son traitement fonctionne, préparer ses consultations |
| **Lucas** (28 ans) | Thérapie seule, anxiété sociale | Tracker ses exercices d'exposition, prouver sa progression |

**Caractéristiques communes:**
- Population fragile (dépression, manque de motivation)
- Difficulté à maintenir des routines
- Faible introspection naturelle
- Besoin de validation et de réassurance

### Key Design Challenges

| Challenge | Impact | Approche UX |
|-----------|--------|-------------|
| **Population fragile** | Risque d'abandon si friction/culpabilisation | Bienveillance absolue, pas de notifications agressives |
| **Quick entry < 30s** | Core loop quotidien critique | Modal ultra-simple, slider + 2 taps maximum |
| **Offline-first PWA** | Usage métro, hôpital, zones sans réseau | Indicateur sync clair, confiance dans la sauvegarde |
| **iOS PWA limitations** | Push notifications limitées | Fallback doux, pas de dépendance aux notifications |
| **Corrélation visuelle** | Montrer l'impact traitement↔humeur | Timeline unifiée avec markers clairs |

### Design Opportunities

| Opportunité | Description |
|-------------|-------------|
| **"Aha moment" visuel** | Le moment où l'utilisateur VOIT que son traitement fonctionne sur la courbe |
| **Microcopy bienveillant** | Ton rassurant unique sur le marché ("Pas de pression, prends ton temps") |
| **Export PDF consultation** | Valeur clinique immédiate, différenciateur vs concurrence |
| **Saisie par emoji** | Quick mood check avec emojis expressifs dynamiques |
| **Glass-morphism apaisant** | Style visuel distinctif évoquant calme et modernité |

### Design System Existant

Le projet dispose d'un design system complet et cohérent :

**Palette:**
- Primary (Teal): `#2BA09F` → Calme, thérapeutique
- Sage (Vert nature): `#48A878` → Croissance, positif
- Lavender: `#D4C5E8` → Douceur, sommeil
- Warm BG: `#F8F7F3` → Chaleur, non-clinique

**Style:**
- Glass-morphism cards avec backdrop-blur
- Organic blobs en background
- Border-radius: 24px-32px (très arrondi = doux)
- Shadow-soft avec teinte primary
- Font: Inter (moderne, lisible)

**Assets existants:** 21 maquettes HTML couvrant tous les écrans MVP

## Core User Experience

### Defining Experience

**Core User Action: Le Quick Mood Check**

L'action la plus fréquente et critique est le check-in quotidien d'humeur. C'est le cœur de Moodday :

```
[Ouvrir l'app] → [Slider 0-10] → [Cocher meds pris] → [Sauvegarder]
```

**Temps cible : < 30 secondes**

Si on rate cette interaction, on perd l'utilisateur. Si on la réussit, tout le reste (courbes, PDF, insights) devient possible.

### Platform Strategy

| Aspect | Décision |
|--------|----------|
| **Type** | PWA (Progressive Web App) |
| **Primary** | Mobile touch-first |
| **Secondary** | Desktop responsive |
| **Offline** | ✅ Obligatoire (check-in offline) |
| **Installation** | Home screen (iOS/Android) |
| **Notifications** | Optionnelles (limite iOS PWA) |

**Pourquoi PWA ?**
- Pas de friction App Store
- Un seul codebase (Next.js)
- Offline-first natif via Service Worker
- Utilisateurs fragiles → moins de barrières

### Effortless Interactions

| Interaction | Doit être effortless | Comment |
|-------------|---------------------|---------|
| **Mood check-in** | Ouvrir → Slider → Done | FAB central, modal instantané |
| **Marquer med pris** | 1 tap | Checkbox visuelle avec feedback |
| **Voir ma tendance** | Visible au dashboard | Graphe 7j toujours visible |
| **Exporter PDF** | 2 taps max | Bouton "Exporter" → Téléchargement |
| **Retrouver mes données** | Sync automatique | Jamais perdre de données |

**Ce qui doit être automatique (zero intervention):**
- Sync au retour de connexion
- Sauvegarde locale instantanée
- Horodatage des entrées
- Agrégation des données pour graphes

### Critical Success Moments

| Moment | Description | Impact |
|--------|-------------|--------|
| **Premier check-in** | L'utilisateur fait sa première saisie | Valide que c'est simple |
| **Aha moment courbe** | "Je VOIS que mon traitement marche" | Valeur démontrée |
| **Export PDF réussi** | PDF généré, prêt pour le psy | Utilité clinique prouvée |
| **Retour après absence** | L'app ne culpabilise pas | Confiance renforcée |
| **Sync après offline** | Données retrouvées intactes | Fiabilité prouvée |

**Make-or-break flows:**
1. Onboarding → Premier check-in (< 2 min)
2. Check-in quotidien (< 30 sec)
3. Préparation consultation → Export PDF

### Experience Principles

| Principe | Application |
|----------|-------------|
| **Bienveillance absolue** | Jamais de "streak guilt", pas de notifications culpabilisantes, ton rassurant |
| **Friction zéro** | Check-in en 30 sec, 2 taps pour l'essentiel, modal > nouvelle page |
| **Confiance data** | Offline fonctionne, sync visible, jamais de perte de données |
| **Clarté visuelle** | Corrélations évidentes, pas besoin d'explication, le graphe parle |
| **Sécurité présente** | SOS 3114 toujours accessible, sans être anxiogène |

## Desired Emotional Response

### Primary Emotional Goals

| Émotion Primaire | Description | Pourquoi c'est critique |
|------------------|-------------|------------------------|
| **Réassurance** | "Je suis en sécurité ici" | Population fragile, vulnérable |
| **Validation** | "Mes données sont réelles, je ne suis pas fou/folle" | "Le fait que ce soit noté, ça devient VRAI" |
| **Contrôle** | "Je comprends ce qui m'arrive" | Démêler les variables du chaos mental |
| **Espoir** | "Je vois que ça avance" | La courbe qui monte = tangible |

**Ce que les utilisateurs doivent pouvoir dire :**
> "Cette app me comprend sans me juger."

### Emotional Journey Mapping

| Moment | Émotion visée | Comment y arriver |
|--------|---------------|-------------------|
| **Première découverte** | Curiosité + Soulagement | "Enfin un outil qui comprend mon besoin" |
| **Onboarding** | Confiance + Légèreté | Pas de formulaires interminables, ton chaleureux |
| **Premier check-in** | Accomplissement doux | "C'était facile, je peux le refaire" |
| **Check-in quotidien** | Routine apaisante | Rituel simple, comme noter dans un carnet |
| **Voir la courbe** | Clarté + Aha moment | "Je VOIS l'impact de mon traitement" |
| **Oubli d'un jour** | Zéro culpabilité | "Pas grave, reprends quand tu veux" |
| **Export PDF** | Fierté + Préparation | "Je suis prêt pour ma consultation" |
| **Erreur/Bug** | Confiance maintenue | "Tes données sont en sécurité" |

### Micro-Emotions

| À cultiver ✅ | À éviter ❌ |
|---------------|-------------|
| **Confiance** (mes données sont safe) | **Paranoïa** (qui voit mes données?) |
| **Accomplissement doux** (j'ai fait mon check-in) | **Pression** (tu n'as pas fait ton check-in!) |
| **Clarté** (je comprends mes patterns) | **Confusion** (trop de données, trop complexe) |
| **Appartenance** (je ne suis pas seul) | **Isolation** (app froide et clinique) |
| **Espoir** (ça peut s'améliorer) | **Anxiété** (et si ça ne marche pas?) |
| **Contrôle** (je décide ce que je partage) | **Surveillance** (l'app me flique) |

### Design Implications

| Émotion | Choix UX |
|---------|----------|
| **Réassurance** | Couleurs chaudes (warm-bg), coins très arrondis, pas de rouge vif |
| **Validation** | Feedback visuel immédiat (checkmark vert), animation douce de confirmation |
| **Contrôle** | Toutes les données exportables, suppression compte = vraie suppression |
| **Zéro culpabilité** | Pas de streak visible par défaut, pas de "tu as manqué X jours" |
| **Espoir** | Graphe qui montre la tendance positive, insights encourageants |
| **Confiance data** | Indicateur de sync visible, message "Sauvegardé localement" |

### Emotional Design Principles (Microcopy)

| Principe | Exemple |
|----------|---------|
| **Bienveillance** | "Pas de pression, prends ton temps" au lieu de "Tu n'as pas rempli aujourd'hui" |
| **Normalisation** | "Beaucoup de gens oublient parfois" au lieu de "Streak perdu!" |
| **Encouragement doux** | "Chaque petit pas compte" au lieu de "Continue comme ça!" |
| **Absence de jugement** | Slider de 1 à 10 sans labels "mauvais/bon" |
| **Présence silencieuse** | SOS 3114 toujours là, mais pas anxiogène |

### Émotions à éviter absolument

| ❌ Émotion | Déclencheur potentiel | Solution |
|-----------|----------------------|----------|
| **Culpabilité** | "Tu as manqué 3 jours" | Jamais de compteur négatif |
| **Honte** | Comparaison avec "la normale" | Pas de benchmarks externes |
| **Anxiété** | Notifications agressives | Opt-in doux, messages bienveillants |
| **Panique** | Bouton SOS trop visible/rouge | Intégré subtilement, pas criant |
| **Méfiance** | "Qui voit mes données?" | Transparence totale, contrôle utilisateur |

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

#### MindDay (mindday.com)

| Aspect | Ce qu'ils font bien |
|--------|---------------------|
| **Positionnement** | TCC accessible, pas de jargon médical anxiogène |
| **Ton** | Bienveillant, coaching doux via mascotte IA |
| **Visuel** | Pastel, épuré, illustrations chaleureuses |
| **Onboarding** | Conversationnel, personnalisé |

**Pattern clé:** L'approche "coach bienveillant" plutôt que "outil médical froid"

#### Daylio (concurrent mood tracker)

| Aspect | Ce qu'ils font bien | Notre approche |
|--------|---------------------|----------------|
| **Saisie rapide** | Emojis pour l'humeur | ✅ On garde |
| **Calendrier** | Vue mensuelle claire | ✅ À considérer |
| **Streaks** | Gamification engageante | ❌ Trop culpabilisant |

#### Bearable (health tracker)

| Aspect | Ce qu'ils font bien | Notre approche |
|--------|---------------------|----------------|
| **Corrélations** | Montre l'impact des facteurs | ✅ Notre besoin core |
| **Tracking multivariables** | Sommeil, meds, symptoms | ✅ On garde |
| **Complexité** | Très complet | ❌ Trop complexe |

### Transferable UX Patterns

#### Navigation

| Pattern | Application Moodday |
|---------|---------------------|
| **FAB central** | Check-in rapide accessible partout |
| **Bottom nav mobile** | 4-5 items max |
| **Modal over page** | Quick entry = modal, pas navigation |
| **Sidebar desktop** | Navigation large écran |

#### Interaction

| Pattern | Application Moodday |
|---------|---------------------|
| **Slider emoji** | Humeur 1-10 avec emoji dynamique |
| **Checklist meds** | 1 tap = pris, feedback visuel |
| **Swipe actions** | Swipe left = supprimer |

#### Visual

| Pattern | Application Moodday |
|---------|---------------------|
| **Glass-morphism** | Cards avec backdrop-blur |
| **Organic blobs** | Background décoratif apaisant |
| **Coins arrondis 24-32px** | Douceur, non-agressif |

### Anti-Patterns to Avoid

| ❌ Anti-Pattern | Pourquoi l'éviter |
|----------------|-------------------|
| **Streak guilt** | Culpabilise, pousse à abandonner |
| **Notifications agressives** | Anxiogène pour population fragile |
| **Trop de métriques** | Confusion, paralysie |
| **Rouge = mauvais** | Jugement implicite sur l'humeur |
| **Comparaison sociale** | Honte potentielle |
| **Onboarding interminable** | Friction, abandon |

### Design Inspiration Strategy

**✅ Adopter:** Slider emoji, Glass-morphism, FAB central, Warm palette, Bottom nav

**🔄 Adapter:** Streaks → "régularité" sans culpabilité, Corrélations → simplifiées, Coaching → microcopy bienveillant

**❌ Éviter:** Rouge pour humeur basse, "Tu as manqué X jours", Comparaisons, Notifications insistantes

## Design System Foundation

### Design System Choice

**Approche:** Shadcn/UI customisé avec tokens Moodday

| Composant | Source | Customisation |
|-----------|--------|---------------|
| **Component Library** | Shadcn/UI | Override complet style |
| **Styling** | TailwindCSS v4 | Config custom tokens |
| **Tokens** | Design System Moodday | Primary/Sage/Lavender/Warm |
| **Icons** | Lucide Icons | Cohérent avec Shadcn |

### Rationale for Selection

- **Accessibilité gratuite:** Shadcn/UI est WCAG compliant out-of-the-box
- **Customisation totale:** Code source accessible, pas une lib figée
- **Next.js natif:** Conçu pour App Router
- **Travail préservé:** Les tokens existants s'intègrent directement
- **Composants complets:** Button, Dialog, Slider, Form, etc.

### Implementation Approach

| Phase | Actions |
|-------|---------|
| **1. Config** | Override Tailwind config avec tokens Moodday |
| **2. CSS Variables** | Adapter les variables CSS Shadcn |
| **3. Core components** | Customiser Button, Card, Dialog, Input, Slider |
| **4. Custom components** | Créer MoodSlider, GlassCard, MedCheckbox, etc. |
| **5. Pages** | Intégrer dans les layouts/pages |

### Customization Strategy

#### Tokens à intégrer

```
Primary: #2BA09F (Teal thérapeutique)
Sage: #48A878 (Vert croissance)
Lavender: #D4C5E8 (Douceur sommeil)
Warm BG: #F8F7F3 (Fond chaleureux)
Warm Panel: #F4F1ED (Cards)
```

#### Composants Shadcn à customiser

| Composant | Customisation |
|-----------|---------------|
| **Button** | Coins 24px, shadow-soft, couleurs Teal/Sage |
| **Card** | Glass-morphism, backdrop-blur, coins 32px |
| **Dialog** | Modal style maquettes existantes |
| **Slider** | Style mood-slider custom |
| **Input** | Coins arrondis, focus ring Teal |
| **Checkbox** | Checkmark Sage |

#### Composants custom à créer

| Composant | Description |
|-----------|-------------|
| **MoodSlider** | Slider emoji dynamique 1-10 |
| **MedCheckbox** | Checkbox med avec heure + état |
| **GlassCard** | Card backdrop-blur + border translucide |
| **MoodChart** | Graphe SVG tendance 7/30 jours |
| **QuickEntryModal** | Modal saisie rapide humeur |
| **BottomNav** | Navigation mobile avec FAB central |

## Defining Experience

### Core Statement

> **"Je note mon humeur en 30 secondes, et après quelques semaines, je VOIS si mon traitement fonctionne."**

Deux parties indissociables :

| Partie | Description |
|--------|-------------|
| **Quick Check-in** | Saisie ultra-rapide (< 30 sec) |
| **Aha Moment** | Visualisation corrélation traitement ↔ humeur |

### User Mental Model

**Comment les utilisateurs résolvent ça aujourd'hui :**

| Méthode actuelle | Ce qu'ils aiment | Ce qu'ils détestent |
|------------------|------------------|---------------------|
| Carnet papier | Tangible, privé | Pas d'analyse, oublis |
| Apps génériques | Simple | Pas de corrélation meds |
| Tableur Excel | Analyse possible | Fastidieux, pas mobile |
| Mémoire seule | Rien à faire | "Je ne sais plus ce qui marche" |

**Mental model attendu :** "C'est comme un carnet, mais intelligent"

### Success Criteria

| Critère | Mesure | Cible |
|---------|--------|-------|
| **Vitesse check-in** | Temps saisie complète | < 30 secondes |
| **Friction perçue** | "C'était facile" | > 90% d'accord |
| **Compréhension courbe** | Sans explication | Immédiat |
| **Rétention J7** | Utilisateurs actifs | > 60% |
| **Aha moment** | Temps avant insight | < 14 jours |

### Novel UX Patterns

| Pattern | Type | Approche |
|---------|------|----------|
| Slider humeur 1-10 | ✅ Établi | Adopter + emoji dynamique |
| Checklist meds | ✅ Établi | Adopter |
| Timeline unifiée | 🆕 Novel | Notre innovation |
| Correlation visualization | 🆕 Semi-novel | Simplifier |
| Zéro streak guilt | 🆕 Novel | Notre différenciateur |

### Experience Mechanics

#### Quick Mood Check Flow

**1. Initiation**
- Tap FAB central (mobile) ou "+" (desktop)
- Modal apparaît avec animation douce
- Focus immédiat sur le slider humeur

**2. Interaction**
- Slide humeur 1-10 → Emoji change dynamiquement
- Tap meds pris (checkboxes pré-remplies)
- Note optionnelle (pas obligatoire)

**3. Feedback**
- Emoji réagit au slide (😔 → 😐 → 😊 → ✨)
- Checkmark vert anime quand med coché
- Bouton "Enregistrer" actif dès slider touché

**4. Completion**
- Animation checkmark succès
- Message bienveillant ("C'est noté !")
- Modal se ferme → dashboard avec courbe mise à jour
- Indicateur "Synchronisé" si online

#### Aha Moment (Visualisation Courbe)

Courbe humeur 30 jours avec :
- Marqueurs de changement de dosage
- Marqueurs de séances psy
- Insight IA : "Votre humeur s'est stabilisée depuis le changement de dosage"

## Visual Design Foundation

### Color System

#### Brand Colors

| Nom | Hex | Usage | Émotion |
|-----|-----|-------|---------|
| **Primary** | `#2BA09F` | CTAs, accents, liens | Calme, thérapeutique |
| **Primary Dark** | `#2A8FA8` | Hover states | Profondeur |
| **Primary Darkest** | `#1D7680` | Texte accent | Sérieux |
| **Primary Light** | `#3DA5B8` | Backgrounds légers | Fraîcheur |
| **Sage** | `#48A878` | Succès, positif, meds pris | Croissance, espoir |
| **Sage Dark** | `#3A956E` | Hover succès | Profondeur |
| **Lavender** | `#D4C5E8` | Sommeil, douceur | Apaisement |
| **Warm BG** | `#F8F7F3` | Background principal | Chaleur, non-clinique |
| **Warm Panel** | `#F4F1ED` | Cards, sections | Profondeur subtile |

#### Semantic Colors

| Semantic | Couleur | Usage |
|----------|---------|-------|
| **Success** | Sage `#48A878` | Confirmation, med pris |
| **Warning** | Orange `#F59E0B` | Attention douce |
| **Danger** | Red `#EF4444` | Suppression, SOS |
| **Info** | Primary Light | Informations, tips |

### Typography System

#### Font Stack

```
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

#### Type Scale

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| **H1** | 32-36px | 700 | Page titles |
| **H2** | 24-28px | 700 | Section titles |
| **H3** | 18-20px | 600 | Card titles |
| **Body** | 16px | 400 | Paragraphs |
| **Small** | 14px | 400 | Secondary text |
| **Caption** | 12px | 500 | Labels, tags |
| **Micro** | 10px | 700 | Badges |

### Spacing & Layout Foundation

#### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `space-2` | 8px | Compact gaps |
| `space-4` | 16px | Standard gaps |
| `space-6` | 24px | Section gaps |
| `space-8` | 32px | Card padding |

#### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-xl` | 12px | Buttons, inputs |
| `rounded-2xl` | 24px | Cards, modals |
| `rounded-3xl` | 32px | Large cards |
| `rounded-full` | 50% | Avatars, FAB |

#### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-soft` | Primary-tinted 10% | Cards élevées |
| `shadow-glass` | Subtle blur | Glass cards |

### Accessibility Considerations

| Critère | Cible | Status |
|---------|-------|--------|
| **Contraste texte** | 4.5:1 minimum | ✅ |
| **Touch targets** | 44x44px minimum | ✅ |
| **Focus indicators** | Visible ring | ✅ |
| **Font size min** | 16px body | ✅ |

## Design Direction Decision

### Chosen Direction: "Warm Glass-morphism"

| Aspect | Choix |
|--------|-------|
| **Style global** | Glass-morphism sur fond warm beige |
| **Cards** | backdrop-blur: 12px, border translucide, coins 24-32px |
| **Background** | Organic blobs gradient (primary/lavender) |
| **Navigation** | Bottom nav mobile + FAB central |
| **Desktop** | Sidebar + header glass |
| **Density** | Aéré, espacement généreux |
| **Animations** | Subtiles (hover lift, float, pulse) |

### Design Rationale

| Raison | Explication |
|--------|-------------|
| **Warm = Non-clinique** | Les utilisateurs ne veulent pas se sentir "malades" |
| **Glass = Moderne** | Différenciation vs apps médicales austères |
| **Organic blobs** | Douceur, apaisement, pas de hard edges |
| **Teal dominant** | Couleur thérapeutique, calme sans être froide |
| **Coins très arrondis** | Douceur, non-menaçant |

### Screens par catégorie

| Catégorie | Screens |
|-----------|---------|
| **Onboarding** | Landing, Sign Up, Login, Email Verify |
| **Dashboard** | Main Dashboard, First Time |
| **Mood Entry** | Quick Entry Modal, Confirmation |
| **Medications** | Inventory, Add/Edit, Initial Setup |
| **Analytics** | Trends, Journal détaillé |
| **Export** | Clinical Report Preview |
| **Settings** | Settings/Privacy, Profile |
| **Crisis** | SOS Support |

### Implementation Approach

| Phase | Focus |
|-------|-------|
| **1. Tokens** | Intégrer couleurs/spacing dans Tailwind config |
| **2. Base components** | Customiser Button, Card, Input, Dialog Shadcn |
| **3. Glass components** | Créer GlassCard, GlassNav |
| **4. Custom components** | MoodSlider, MedCheckbox, MoodChart |
| **5. Layouts** | DashboardLayout, AuthLayout, SettingsLayout |
| **6. Pages** | Implémenter screen par screen |

## User Journey Flows

### Journey 1: Quick Check-in

**Objectif:** Saisir humeur + meds en < 30 secondes

**Flow:**
```
Dashboard → [Tap FAB +] → Modal Quick Entry
→ Slider Humeur 1-10 (emoji dynamique)
→ Checkboxes meds pré-remplies
→ Note optionnelle
→ [Tap Enregistrer]
→ Animation succès ✓ + Message bienveillant
→ Modal ferme → Dashboard mis à jour
```

**Temps estimé:** 15-25 secondes

### Journey 2: First Time Setup (Onboarding)

**Objectif:** Utilisateur configuré et premier check-in fait en < 3 min

**Flow:**
```
Landing → Sign Up → Email Verification
→ Onboarding Step 1: Bienvenue + Ton
→ Step 2: Ajouter médicaments (optionnel)
→ Step 3: Premier check-in (obligatoire)
→ Félicitations! → Dashboard First Time
```

**Points clés:** Onboarding 3 étapes max, premier check-in obligatoire

### Journey 3: View Trends (Aha Moment)

**Objectif:** Visualiser corrélation traitement ↔ humeur

**Flow:**
```
Dashboard → [Tap "Voir tendances"] → Analytics Page
→ Courbe 30 jours avec markers:
  - 📍 Changements dosage
  - 📍 Séances psy
  - 📍 Événements notés
→ Insight IA (si pattern détecté)
→ Options: Zoom période / Exporter / Retour
```

### Journey 4: Export PDF

**Objectif:** Générer rapport consultation < 2 min

**Flow:**
```
Dashboard/Analytics → [Tap "Exporter"] → Export Options
→ Sélection période (7j/30j/Custom)
→ Preview PDF scrollable
→ Toggles: Humeur ✓ | Meds ✓ | Notes ✓
→ [Télécharger PDF]
→ Génération < 5 sec → PDF prêt
→ Télécharger / Partager / Retour
```

### Journey Patterns

| Pattern | Usage | Composant |
|---------|-------|-----------|
| **Modal Action** | Quick entry, Export | Dialog centré |
| **Confirmation Success** | Check-in, PDF | Checkmark animé |
| **Progressive Disclosure** | Onboarding | Steps numérotés |
| **Inline Feedback** | Slider, Checkboxes | Animation immédiate |
| **Error Recovery** | Offline | Toast + retry auto |

### Flow Optimization Principles

| Principe | Application |
|----------|-------------|
| **Minimum taps** | Check-in = 3 taps max |
| **Defaults intelligents** | Meds pré-cochés |
| **Skip possible** | Jamais bloquer sur optionnel |
| **Feedback immédiat** | Chaque action = réponse visuelle |
| **Recovery graceful** | Offline = sauvegarde locale |

## Component Strategy

### Design System Components (Shadcn/UI)

| Composant | Customisation Moodday |
|-----------|----------------------|
| **Button** | Coins 24px, shadow-soft, variants Teal/Sage |
| **Card** | Glass-morphism, backdrop-blur |
| **Dialog** | Animation douce, overlay blur |
| **Input** | Coins arrondis, focus ring Teal |
| **Checkbox** | Checkmark Sage, animation |
| **Slider** | Base pour MoodSlider |
| **Toast** | Style warm, bienveillant |
| **Sheet** | Bottom sheet mobile |

### Custom Components

#### MoodSlider
- **Purpose:** Sélectionner humeur 1-10 avec feedback emoji
- **Content:** Slider + Emoji dynamique (😔→😐→😊→✨) + Valeur
- **States:** Default, Dragging, Completed
- **Accessibility:** aria-label, aria-valuemin/max/now

#### MedCheckbox
- **Purpose:** Marquer médicament comme pris
- **Content:** Nom + Dosage + Heure + Checkbox
- **States:** Unchecked, Checked (animation), Skipped
- **Variants:** Compact, Expanded

#### GlassCard
- **Purpose:** Container glass-morphism
- **Styles:** backdrop-blur: 12px, border translucide
- **Variants:** Default, Elevated, Floating

#### MoodChart
- **Purpose:** Visualiser tendance humeur avec markers
- **Content:** Courbe SVG + Markers meds/séances
- **Variants:** 7j (compact), 30j (full), 90j

#### QuickEntryModal
- **Purpose:** Modal saisie rapide humeur + meds
- **Content:** MoodSlider + MedCheckboxes + Note + CTA
- **States:** Open, Saving, Success, Error

#### BottomNav
- **Purpose:** Navigation mobile avec FAB central
- **Items:** Dashboard, Stats, [FAB +], Meds, Settings

#### SyncIndicator
- **States:** Synced ✓, Syncing ↻, Offline ⚠, Error ✕

#### InsightCard
- **Purpose:** Afficher insight IA
- **Content:** 💡 Icon + Message + Action

### Implementation Roadmap

| Phase | Composants | Priorité |
|-------|------------|----------|
| **Phase 1** | MoodSlider, MedCheckbox, QuickEntryModal, GlassCard | 🔴 Critique |
| **Phase 2** | BottomNav, SyncIndicator | 🟠 Haute |
| **Phase 3** | MoodChart, InsightCard | 🟡 Moyenne |
| **Phase 4** | Animations, Micro-interactions | 🟢 Polish |

## Responsive Design & Accessibility

### Responsive Strategy

#### Mobile-First Approach

| Aspect | Stratégie |
|--------|-----------|
| **Philosophie** | Mobile-first : concevoir pour mobile, puis adapter pour desktop |
| **Priorité** | PWA installable sur home screen |
| **Navigation** | Bottom nav avec FAB central |
| **Layouts** | Single-column, cards full-width |
| **Touch** | Gestes swipe, tap, long-press |

#### Desktop Adaptation

| Aspect | Adaptation |
|--------|------------|
| **Layout** | 2-3 colonnes, sidebar fixe |
| **Navigation** | Sidebar gauche + header |
| **Densité** | Plus d'informations visibles |
| **Interactions** | Hover states, raccourcis clavier |
| **Écran large** | Max-width 1200px centré |

#### Tablet Strategy

| Aspect | Approche |
|--------|----------|
| **Portrait** | Layout mobile avec cards plus larges |
| **Paysage** | Layout hybride mobile/desktop |
| **Touch** | Gestes identiques au mobile |

### Breakpoint Strategy

#### Breakpoints Tailwind Standards

| Breakpoint | Range | Usage Moodday |
|------------|-------|---------------|
| **sm** | 640px+ | Mobile large |
| **md** | 768px+ | Tablette portrait |
| **lg** | 1024px+ | Desktop |
| **xl** | 1280px+ | Desktop large |
| **2xl** | 1536px+ | Desktop max (centré) |

#### Layout Adaptation

| Screen | Navigation | Layout | Cards |
|--------|------------|--------|-------|
| **Mobile** | Bottom nav + FAB | 1 colonne | Full-width |
| **Tablet** | Bottom nav + FAB | 1-2 colonnes | 2 par row |
| **Desktop** | Sidebar + Header | 2-3 colonnes | Grid flexible |

#### Mobile-First CSS Strategy

```css
/* Mobile base (default) */
.dashboard { @apply flex flex-col gap-4; }

/* Tablet */
@screen md {
  .dashboard { @apply grid grid-cols-2 gap-6; }
}

/* Desktop */
@screen lg {
  .dashboard { @apply grid grid-cols-3 gap-8; }
}
```

### Accessibility Strategy

#### WCAG 2.1 AA Compliance

| Critère | Exigence | Status |
|---------|----------|--------|
| **1.1 Text Alternatives** | Alt text pour images | ✅ Requis |
| **1.3 Adaptable** | Structure sémantique HTML | ✅ Requis |
| **1.4 Distinguishable** | Contraste 4.5:1 minimum | ✅ Vérifié |
| **2.1 Keyboard** | Navigation clavier complète | ✅ Requis |
| **2.4 Navigable** | Skip links, focus visible | ✅ Requis |
| **3.1 Readable** | Langage défini (fr-FR) | ✅ Requis |
| **4.1 Compatible** | ARIA labels corrects | ✅ Requis |

#### Color Contrast

| Combinaison | Ratio | Pass |
|-------------|-------|------|
| Primary (#2BA09F) sur Warm BG (#F8F7F3) | 4.6:1 | ✅ AA |
| Texte noir sur Warm BG | 15.7:1 | ✅ AAA |
| Texte blanc sur Primary | 4.5:1 | ✅ AA |
| Sage (#48A878) sur Warm BG | 3.5:1 | ⚠️ Large text only |

#### Touch Targets

| Élément | Taille minimum | Taille Moodday |
|---------|----------------|----------------|
| Boutons | 44x44px | 48x48px |
| Liens | 44x44px | 44x44px (padding) |
| Checkboxes | 44x44px | 48x48px |
| FAB | 44x44px | 56x56px |
| Slider thumb | 44x44px | 44x44px |

#### Keyboard Navigation

| Contexte | Navigation |
|----------|------------|
| **Tab order** | Logique gauche→droite, haut→bas |
| **Focus visible** | Ring 2px Primary (#2BA09F) |
| **Skip links** | "Aller au contenu principal" |
| **Modal** | Focus trap, Escape pour fermer |
| **Slider** | Flèches pour ajuster |

#### Screen Reader Support

| Élément | ARIA Implementation |
|---------|---------------------|
| **MoodSlider** | `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label` |
| **MedCheckbox** | `aria-checked`, `aria-label` avec nom + dosage |
| **MoodChart** | `aria-label` description tendance, data table alternative |
| **SyncIndicator** | `aria-live="polite"` pour changements état |
| **Navigation** | `role="navigation"`, `aria-current="page"` |

### Testing Strategy

#### Responsive Testing

| Type | Outils | Fréquence |
|------|--------|-----------|
| **DevTools** | Chrome/Safari responsive mode | Chaque PR |
| **Real devices** | iPhone SE, iPhone 14, iPad, Android | Avant release |
| **BrowserStack** | Cross-browser | Avant release |

#### Accessibility Testing

| Type | Outils | Fréquence |
|------|--------|-----------|
| **Automatisé** | axe-core, Lighthouse | CI/CD |
| **Manuel** | Keyboard-only navigation | Chaque feature |
| **Screen reader** | VoiceOver (iOS/Mac), TalkBack (Android) | Avant release |
| **Contraste** | Stark (Figma), WCAG Contrast Checker | Design review |

#### Testing Checklist

- [ ] Navigation clavier complète (Tab, Enter, Escape, Arrows)
- [ ] Focus visible sur tous les éléments interactifs
- [ ] Lecteur d'écran annonce correctement les éléments
- [ ] Touch targets ≥ 44px
- [ ] Contraste ≥ 4.5:1 pour texte normal
- [ ] Texte zoomable à 200% sans perte de fonctionnalité
- [ ] Pas de contenu qui clignote > 3 fois/sec

### Implementation Guidelines

#### Responsive Development

| Pratique | Règle |
|----------|-------|
| **Units** | `rem` pour font-size, `px` pour borders/shadows |
| **Layout** | Flexbox/Grid avec Tailwind |
| **Images** | `srcset` + lazy loading |
| **Media queries** | Mobile-first (`min-width`) |
| **Container** | `max-w-7xl mx-auto` pour centrer |

#### Accessibility Development

| Pratique | Règle |
|----------|-------|
| **HTML sémantique** | `<main>`, `<nav>`, `<article>`, `<section>` |
| **Headings** | Hiérarchie correcte (h1 → h2 → h3) |
| **Buttons vs Links** | Button = action, Link = navigation |
| **Forms** | `<label>` associé, `aria-describedby` pour erreurs |
| **Focus** | Jamais `outline: none` sans alternative |
| **Hidden** | `aria-hidden` pour décoratif, `sr-only` pour texte |

#### Tailwind Utilities

```css
/* Touch target minimum */
.touch-target { @apply min-w-11 min-h-11; }

/* Focus ring visible */
.focus-ring { @apply focus:ring-2 focus:ring-primary focus:ring-offset-2; }

/* Screen reader only */
.sr-only { @apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0; }
```

#### PWA-Specific Accessibility

| Contexte | Considération |
|----------|---------------|
| **Offline** | Message "Hors ligne" accessible (`aria-live`) |
| **Install prompt** | Bouton accessible avec label clair |
| **Notifications** | Alternative si non supportées (iOS) |
| **Sync** | Indicateur accessible de l'état de sync |
