---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-03-success", "step-04-journeys", "step-05-domain", "step-06-innovation", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish", "step-12-complete"]
inputDocuments:
  - "_bmad-output/planning-artifacts/product-brief-moodday-2026-01-20.md"
  - "_bmad-output/analysis/brainstorming-session-2026-01-20.md"
workflowType: 'prd'
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 1
  projectDocs: 0
classification:
  projectType: "web_app"
  projectTypeDetail: "PWA (Progressive Web App)"
  domain: "healthcare"
  domainDetail: "wellness/mental health tracking"
  complexity: "medium"
  projectContext: "greenfield"
---

# Product Requirements Document - Moodday

**Author:** Yoannandrieux
**Date:** 2026-01-20

## Implementation Status (2026-01-23)

**Snapshot:** See `PROJECT_STATUS.md` for the full audit.

**Highlights:**
- ✅ Core data models + CRUD complets (mood/meds/therapy/exercises)
- ✅ Dashboard branché aux vraies données (meds/sleep/streak/trend)
- ✅ Quick Entry modal/FAB câblé + onboarding fonctionnel
- ✅ Subscription management via Stripe portal + upload avatar
- ✅ PWA (manifest + SW + offline mood queue) + notifications locales
- ⚠️ Push notifications serveur & sync offline complet restent à faire

## Executive Summary

### Vision Produit

**Moodday** est un journal clinique digital (PWA) pour les personnes vivant avec des troubles psychiatriques ou en psychothérapie. L'app répond à une question fondamentale : *"Mon traitement fonctionne-t-il ?"*

### Différenciateur Clé

> **"Le témoin objectif et bienveillant"** — Quand le cerveau ment, l'app dit la vérité. Quand la mémoire flanche, l'app se souvient.

Contrairement aux trackers wellness génériques (Daylio, Bearable), Moodday se positionne comme un **carnet de psy digital** avec :
- Corrélation explicite médicaments ↔ humeur ↔ exercices thérapie
- Cycle de séance psy (avant/pendant/après)
- Export PDF pour consultations médicales
- Philosophie bienveillante (zéro streak guilt)

### Scope MVP

10-12 screens, 8 semaines de développement. Features core : Quick Mood Check, Medication Tracker, Therapy Notes, Exercise Tracker, Courbe 30j, Export PDF.

### Personas Cibles

- **Marie** (34 ans) : Patiente multi-suivis, 3 médicaments, veut voir si son traitement marche
- **Lucas** (28 ans) : Thérapie seule, veut tracker ses exercices d'exposition et montrer sa progression

*Détails complets : voir [User Journeys](#user-journeys) et [Product Scope](#product-scope)*

---

## Success Criteria

### User Success

**Pour Marie (patiente multi-suivis):**
- ≥4 check-ins humeur/semaine (pas 7 - bienveillance)
- Note post-séance dans les 24h après RDV psy
- ≥1 PDF généré avant consultation psychiatre
- Première corrélation médicament↔humeur identifiée en < 4 semaines

**Pour Lucas (thérapie-only):**
- ≥2 exercices psy notés/semaine
- Évaluation "bénéfique/neutre/négatif" sur 80% des exercices
- Consultation des données avant RDV (< 24h avant)

**Moment "Worth It":**
> L'utilisateur arrive en séance et dit: "Cette semaine j'ai testé X, voici ce que j'ai observé..." au lieu de "Euh... ça va je crois."

### Business Success

**À 3 mois (MVP):**
- 500 utilisateurs actifs (≥1 check-in/semaine)
- NPS ≥ 40 sur early adopters
- Rétention J30 ≥ 40%

**À 12 mois:**
- 10 000 utilisateurs actifs
- 5% conversion premium
- ≥50 psys/psychiatres recommandent l'app

### Technical Success

- Time-to-value < 14 jours (premier "aha moment")
- Saisie quotidienne < 30 secondes
- Export PDF générable en < 5 secondes
- App utilisable offline (PWA)

### Measurable Outcomes

**North Star Metric:**
> **"Consultations préparées"** = Utilisateurs ayant consulté leurs données ou généré un PDF dans les 48h précédant un RDV médical.

**KPIs secondaires:**

| KPI | Cible |
|-----|-------|
| DAU/MAU | ≥ 30% |
| Rétention J7 | ≥ 60% |
| Rétention J30 | ≥ 40% |
| Check-ins/semaine | ≥ 4 |
| Time-to-value | < 14 jours |
| PDF exports/mois | ≥ 1 par user actif |

## Product Scope

### MVP - Minimum Viable Product

| Feature | Description |
|---------|-------------|
| Quick Mood Check | Slider 0-10 + note (<30 sec) |
| Medication Tracker | Liste meds + dosages + pris aujourd'hui |
| Therapy Notes | Notes post-séance + exercices |
| Exercise Tracker | Exercices psy + évaluation efficacité |
| Timeline Courbe 30j | Graphe unifié humeur + meds + séances |
| Export PDF | 1 page pour consultation |
| Onboarding bienveillant | Setup meds + ton rassurant |

**Screens MVP (10-12):**
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

### Growth Features (Post-MVP)

- Système Aidants avec permissions granulaires
- Tracking énergie + sommeil
- Tags événements personnalisés
- Calendrier RDV psy intégré
- Notifications rappel séance

### Vision (Future)

- IA détection patterns (sans diagnostic)
- Signaux passifs (Strava, Apple Health)
- Mode Pro pour psychiatres
- Corrélations multi-variables automatiques
- Intégration Doctolib

## User Journeys

### Journey 1: Marie - "Reprendre le contrôle"

**Persona:** Marie, 34 ans, patiente multi-suivis (psychiatre + psychologue), trouble bipolaire, 3 médicaments

**Opening Scene:**
Marie est assise dans la salle d'attente de son psychiatre. Elle feuillette nerveusement son carnet papier où elle a griffonné quelques notes. "Comment ça s'est passé ce mois-ci ?" va lui demander le Dr. Martin. Et comme d'habitude, elle va répondre "Euh... plutôt bien je crois ?" alors qu'elle sait que c'est plus compliqué que ça.

**Rising Action:**
1. Marie découvre Moodday via sa psychologue qui cherchait un outil pour ses patients
2. Elle installe l'app, configure ses 3 médicaments actuels (Lamictal 150mg, Xanax PRN, Stilnox)
3. L'onboarding la rassure: "Pas de pression, prends ton temps"
4. Chaque soir, notification douce → slider humeur (4 secondes) + "Médicaments pris ?" (2 taps)
5. Après sa séance psy du mercredi, elle note: "Travaillé sur poser mes limites. Exercice: dire non une fois cette semaine"
6. Vendredi, elle dit non à un collègue → note dans l'app: "Dit non. Stressant mais fière"

**Climax (Semaine 3):**
Marie ouvre l'app et voit sa courbe 30 jours. Elle remarque que depuis l'augmentation de Lamictal il y a 2 semaines, sa moyenne humeur est passée de 4.2 à 5.8. "Le fait que ce soit noté, ça devient VRAI." Pour la première fois, elle VOIT que le traitement fonctionne.

**Resolution:**
Consultation psychiatre. Marie ouvre l'app, génère le PDF. Le Dr. Martin regarde les données: "Je vois que l'augmentation du Lamictal a eu un effet positif. Et vous avez noté moins de prises de Xanax PRN. On continue comme ça." Pour la première fois, la consultation est basée sur des FAITS, pas des souvenirs flous.

---

### Journey 2: Lucas - "Les petites victoires"

**Persona:** Lucas, 28 ans, thérapie seule (anxiété sociale), pas de médicaments

**Opening Scene:**
Lucas évite la machine à café du bureau. Il y a toujours du monde, et l'idée de faire la conversation le paralyse. Son psy lui a donné des "exercices d'exposition progressive" mais il n'arrive pas à les appliquer. En séance, il dit "ça va" alors qu'il sait qu'il stagne.

**Rising Action:**
1. Lucas installe Moodday (pas de médicaments à configurer)
2. Il crée ses premiers exercices d'exposition: "Aller à la machine à café quand il y a 1 personne"
3. Lundi, il y va. Une collègue lui dit bonjour. Il répond. Note dans l'app: "Machine café - 1 personne - Anxiété 7/10 avant, 4/10 après. Bénéfique."
4. Mercredi, il retente. "2 personnes - Anxiété 6/10 avant, 3/10 après. Plus facile."
5. Avant sa séance psy, il consulte ses données des 2 semaines

**Climax:**
En séance, Lucas ouvre l'app: "J'ai fait la machine à café 6 fois en 2 semaines. Au début anxiété 7, maintenant 4. J'ai des preuves que ça marche." Son psy sourit: "C'est exactement ce qu'on cherchait - voir ta progression."

**Resolution:**
Lucas a un nouvel objectif: "Déjeuner avec un collègue." Il sait qu'il pourra tracker ses petites victoires et les montrer à son psy. L'introspection est devenue tangible.

---

### Journey 3: Sophie - "Veiller sans surveiller" (V1)

**Persona:** Sophie, 45 ans, aidante proche de Paul (bipolaire)

**Opening Scene:**
Sophie remarque que son compagnon Paul dort plus que d'habitude et a annulé deux sorties cette semaine. Elle s'inquiète mais ne veut pas paraître intrusive. La dernière fois qu'elle a dit "Tu as l'air déprimé", il s'est braqué.

**Rising Action:**
1. Paul utilise Moodday depuis 2 mois et a invité Sophie comme "aidante"
2. Sophie reçoit une notification: "Paul a eu 3 jours consécutifs sous 4/10"
3. Elle ne dit rien directement, mais propose: "Et si on allait marcher ce weekend ?"
4. Elle peut ajouter une observation (optionnel): "Paul semble plus fatigué, a annulé 2 sorties"

**Climax:**
Paul consulte ses données avant son RDV psychiatre et voit l'observation de Sophie: "Ah oui, c'est vrai que j'ai annulé des trucs..." Il n'avait pas remarqué le pattern lui-même.

**Resolution:**
Sophie se sent utile sans être intrusive. Paul apprécie d'avoir un "témoin bienveillant" qui voit ce qu'il ne voit pas. L'app permet la collaboration sans le conflit.

---

### Journey 4: Dr. Benoit - "Des données, enfin"

**Persona:** Dr. Benoit, psychiatre libéral, 40 patients/semaine

**Opening Scene:**
Dr. Benoit voit 40 patients par semaine, 20 minutes chacun. Quand il demande "Comment ça s'est passé depuis la dernière fois ?", il obtient des réponses vagues. Il ajuste les traitements un peu à l'aveugle.

**Rising Action:**
1. Un de ses patients arrive avec un PDF Moodday
2. Dr. Benoit scanne le document en 30 secondes: courbe humeur, changements de dosage marqués, notes importantes
3. Il voit immédiatement: "L'augmentation de Lamictal au 15/01 → amélioration visible à partir du 22/01"

**Climax:**
"C'est exactement ce dont j'ai besoin. Des données objectives, pas des impressions." Il recommande Moodday à ses autres patients.

**Resolution:**
Ses consultations sont plus efficaces. Il peut ajuster les traitements avec des données concrètes. Il devient un "ambassadeur" de l'app.

---

### Journey Requirements Summary

| Journey | Capabilities révélées |
|---------|----------------------|
| **Marie** | Quick entry, medication tracking, therapy notes, courbe 30j, PDF export, onboarding bienveillant |
| **Lucas** | Exercise tracking, évaluation efficacité, consultation pré-séance, progression visible |
| **Sophie** | Système aidant, alertes, observations aidant (V1) |
| **Dr. Benoit** | PDF export optimisé, visualisation rapide |

**MVP Focus:** Marie & Lucas journeys (patient autonome)
**V1 Addition:** Sophie journey (système aidants)

## Domain-Specific Requirements

> Les exigences suivantes sont spécifiques au domaine de la santé mentale et de la gestion de données personnelles sensibles.

### Compliance & Regulatory

**RGPD (Europe) - Applicable:**
- Consentement explicite pour collecte données santé
- Droit à l'effacement (suppression compte = suppression données)
- Portabilité des données (export JSON/CSV)
- Base légale: consentement utilisateur

**HIPAA (US) - Non applicable:**
- Moodday = journal personnel, pas "covered entity"
- PDF généré par l'utilisateur qui choisit de le montrer
- Disclaimer: "Non-medical app, personal use only"

**Données de Santé (France):**
- Hébergement HDS recommandé si B2B, pas obligatoire pour app grand public

### Technical Constraints

**Sécurité:**
- Chiffrement at rest (données stockées)
- Chiffrement in transit (HTTPS)
- Authentification sécurisée
- Pas de données santé dans les logs/analytics

**Privacy by Design:**
- Données minimales collectées
- Pas de tracking tiers sur données santé
- Analytics anonymisées uniquement
- Pas de vente/partage de données

**Offline & Résilience:**
- PWA fonctionnelle offline
- Sync automatique quand connexion revient
- Données locales sécurisées

### Considérations Éthiques

**Tone & Messaging:**
- Jamais de langage culpabilisant
- Pas de gamification agressive (streaks)
- Pas de diagnostic médical
- Disclaimers: "Consultez un professionnel de santé"

**Vulnérabilité utilisateurs:**
- Population fragile
- Pas de contenu anxiogène
- Ressources d'aide optionnelles (V1)

### Risk Mitigations

| Risque | Mitigation |
|--------|------------|
| Fuite données santé | Chiffrement + audit sécurité |
| Utilisateur en crise | Disclaimer + ressources d'aide |
| Mauvaise interprétation | "Ne remplace pas un professionnel" |
| Dépendance app | Pas de notifications agressives |

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Corrélation Multi-Variables**
- Lien explicite: humeur ↔ médicaments ↔ dosages ↔ exercices thérapie
- Visualisation timeline unifiée (pas vue ailleurs dans les apps grand public)

**2. Cycle de Séance Psy**
- Avant: préparer la consultation avec données
- Après: noter ce qu'on a compris, exercices à faire
- Entre: tracker l'application des exercices
- = "Carnet de psy digital" - approche originale

**3. Philosophie Bienveillante**
- Zéro streak guilt (pas de gamification culpabilisante)
- Notifications douces, pas agressives
- Microcopy rassurant adapté à population fragile
- Design éthique pour santé mentale

### Market Context

**Positionnement unique:** "Journal clinique pour consultation psy" vs "Wellness tracker général"

| Concurrent | Focus | Manque |
|------------|-------|--------|
| Daylio | Mood tracking général | Pas de meds, pas de psy |
| Bearable | Symptômes + triggers | Complexe, pas focus psy |
| MindDoc | CBT exercices | Pas de suivi meds |
| **Moodday** | Meds + Thérapie + Export psy | - |

### Validation Approach

| Innovation | Méthode de validation |
|------------|----------------------|
| Corrélation meds↔humeur | User interviews: "Avez-vous identifié une corrélation?" |
| Cycle séance psy | Taux de notes post-séance dans les 24h |
| Bienveillance | NPS + feedback qualitatif + rétention |

### Innovation Risks & Mitigation

| Risque | Mitigation |
|--------|------------|
| Trop de features = complexité | MVP ultra-simple, ajouts progressifs |
| Innovation copiable facilement | Exécution rapide, communauté fidèle |
| Pas assez innovant pour buzz | Focus product-market fit, pas buzz |

## Web App Specific Requirements

### Project-Type Overview

Moodday est une **Progressive Web App (PWA)** construite avec Next.js 15+, optimisée pour mobile-first avec capacités offline.

**Stack technique (boilerplate existant):**
- Framework: Next.js 15 avec App Router
- Styling: TailwindCSS v4 + Shadcn/UI
- Database: PostgreSQL (NeonDB) + Prisma
- Auth: Better Auth
- Hosting: Vercel

### Technical Architecture Considerations

**PWA Requirements:**
- Service Worker pour cache offline
- Web App Manifest pour installation
- Push notifications (iOS 16.4+ limité)
- IndexedDB pour stockage local

**Offline-First Strategy:**
- Check-in humeur fonctionne offline
- Sync automatique au retour de connexion
- Indicateur visuel état connexion
- Conflict resolution: "last write wins"

### Browser & Platform Support

| Platform | Browser | Support Level |
|----------|---------|---------------|
| iOS | Safari | Primary (PWA limitations) |
| Android | Chrome | Primary |
| Desktop | Chrome/Edge/Firefox | Secondary |

**iOS PWA Limitations:**
- Push notifications limitées (iOS 16.4+)
- Pas de background sync
- Storage limité (quota)

### Responsive Design

**Breakpoints:**
- Mobile: 375px (iPhone SE) - PRIMARY
- Tablet: 768px - Secondary
- Desktop: 1024px+ - Tertiary

**Mobile-First Approach:**
- Touch-friendly targets (min 44px)
- Thumb-zone optimization pour check-in rapide
- Pas de hover-dependent interactions

### Performance & Accessibilité

*Voir section [Non-Functional Requirements](#non-functional-requirements) pour les critères mesurables détaillés (NFR-P1 à P7 pour performance, NFR-A1 à A7 pour accessibilité WCAG 2.1 AA).*

### Implementation Stack

```
Frontend: Next.js 15 + React 19 + TailwindCSS v4
Backend: Next.js API Routes + Prisma + PostgreSQL
Auth: Better Auth (multi-provider)
Hosting: Vercel (edge functions)
PWA: next-pwa ou workbox
PDF: react-pdf ou jspdf
Charts: recharts ou chart.js
```

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP
> Minimum viable pour que Marie dise "Je vois que mon traitement marche" et que Lucas dise "J'ai des preuves de ma progression"

**Scope Classification:** Medium (10-12 screens, 7 features core)

### MVP Feature Set (Phase 1)

*Détails des features MVP : voir section [Product Scope](#product-scope).*

**Core User Journeys Supported:**
- ✅ Marie - Check-in quotidien + Export PDF consultation
- ✅ Lucas - Exercices thérapie + Évaluation efficacité

**Explicitly OUT of MVP:**
- ❌ Système Aidants (complexité permissions)
- ❌ Tracking énergie/sommeil (scope creep)
- ❌ Tags événements
- ❌ IA corrélations
- ❌ Intégrations externes

### Phased Roadmap

| Phase | Timeline | Features |
|-------|----------|----------|
| **MVP** | 8 semaines | Quick Mood, Meds, Therapy Notes, Exercices, Courbe, PDF |
| **V1** | +2-3 mois | Système Aidants, Énergie/Sommeil, Tags, Calendrier RDV |
| **V2** | +6 mois | IA patterns, Signaux passifs, Mode Pro psychiatres |

### Risk Mitigation Strategy

| Type | Risque | Mitigation |
|------|--------|------------|
| **Technique** | PWA offline sync complexe | "Last write wins" simple pour MVP |
| **Technique** | PDF generation | Libs éprouvées (jspdf/react-pdf) |
| **Marché** | Rétention faible (apps santé mentale) | Bienveillance UX, pas de streak guilt |
| **Marché** | Concurrence (Daylio, Bearable) | Focus niche psychiatrique/psy |
| **Ressource** | Dev solo | MVP ultra-lean, boilerplate existant |

### Resource Requirements

**MVP Team:** 1 développeur full-stack + boilerplate existant
**Timeline:** 8 semaines

## Functional Requirements

> Cette section définit le **contrat de capacités** du produit. Chaque FR représente une capacité testable que le système doit offrir. Si une capacité n'est pas listée ici, elle ne sera pas implémentée.

### Gestion Utilisateur & Authentification

- **FR1:** Un utilisateur peut créer un compte avec email/mot de passe ou OAuth (Google, GitHub)
- **FR2:** Un utilisateur peut se connecter à son compte existant
- **FR3:** Un utilisateur peut réinitialiser son mot de passe
- **FR4:** Un utilisateur peut se déconnecter de son compte
- **FR5:** Un utilisateur peut supprimer son compte et toutes ses données associées
- **FR6:** Un utilisateur peut exporter toutes ses données personnelles (portabilité RGPD)

### Suivi d'Humeur (Mood Tracking)

- **FR7:** Un utilisateur peut enregistrer son humeur sur une échelle de 0-10
- **FR8:** Un utilisateur peut ajouter une note libre à son check-in humeur
- **FR9:** Un utilisateur peut voir l'historique de ses check-ins humeur
- **FR10:** Un utilisateur peut modifier un check-in humeur passé
- **FR11:** Un utilisateur peut supprimer un check-in humeur

### Gestion des Médicaments

- **FR12:** Un utilisateur peut ajouter un médicament à sa liste (nom, dosage)
- **FR13:** Un utilisateur peut modifier les informations d'un médicament
- **FR14:** Un utilisateur peut archiver un médicament qu'il ne prend plus
- **FR15:** Un utilisateur peut voir sa liste de médicaments actifs
- **FR16:** Un utilisateur peut enregistrer la prise d'un médicament quotidien
- **FR17:** Un utilisateur peut enregistrer la prise d'un médicament PRN (à la demande)
- **FR18:** Un utilisateur peut voir l'historique de ses prises de médicaments
- **FR19:** Un utilisateur peut modifier l'historique d'un changement de dosage

### Notes de Thérapie & Exercices

- **FR20:** Un utilisateur peut créer une note de séance psy (date, résumé, exercices assignés)
- **FR21:** Un utilisateur peut modifier une note de séance
- **FR22:** Un utilisateur peut voir l'historique de ses notes de séances
- **FR23:** Un utilisateur peut créer un exercice thérapeutique à pratiquer
- **FR24:** Un utilisateur peut enregistrer la réalisation d'un exercice
- **FR25:** Un utilisateur peut évaluer l'efficacité d'un exercice (bénéfique/neutre/négatif)
- **FR26:** Un utilisateur peut ajouter une note à la réalisation d'un exercice
- **FR27:** Un utilisateur peut voir l'historique de ses exercices avec leurs évaluations

### Visualisation des Données

- **FR28:** Un utilisateur peut voir une courbe de son humeur sur 30 jours
- **FR29:** Un utilisateur peut voir les changements de dosage de médicaments sur la timeline
- **FR30:** Un utilisateur peut voir les séances de thérapie marquées sur la timeline
- **FR31:** Un utilisateur peut voir ses check-ins, prises de meds et exercices sur un dashboard unifié

### Export & Partage

- **FR32:** Un utilisateur peut générer un PDF résumé de ses données pour consultation médicale
- **FR33:** Un utilisateur peut choisir la période à inclure dans le PDF
- **FR34:** Un utilisateur peut partager/télécharger le PDF généré

### Configuration & Personnalisation

- **FR35:** Un utilisateur peut configurer ses préférences de notifications
- **FR36:** Un utilisateur peut modifier son profil (nom, email)
- **FR37:** Un utilisateur peut configurer l'heure de rappel quotidien

### Fonctionnalités Offline & PWA

- **FR38:** Un utilisateur peut installer l'application sur son appareil (PWA)
- **FR39:** Un utilisateur peut effectuer un check-in humeur sans connexion internet
- **FR40:** Le système synchronise automatiquement les données locales quand la connexion revient
- **FR41:** Un utilisateur peut voir un indicateur de son état de connexion/synchronisation

### Onboarding

- **FR42:** Un nouvel utilisateur est guidé à travers un onboarding de configuration initiale
- **FR43:** Un utilisateur peut configurer ses médicaments actuels pendant l'onboarding
- **FR44:** Un utilisateur peut passer/reporter des étapes d'onboarding non-essentielles

## Non-Functional Requirements

> Cette section définit les **attributs de qualité** du système : comment le produit doit performer, pas ce qu'il doit faire. Chaque NFR est mesurable et testable.

### Performance

| NFR | Critère | Justification |
|-----|---------|---------------|
| **NFR-P1** | Saisie check-in humeur complète en < 30 secondes | Core loop quotidien, friction = abandon |
| **NFR-P2** | Génération PDF en < 5 secondes | Valeur clinique immédiate |
| **NFR-P3** | Largest Contentful Paint (LCP) < 2.5s | Core Web Vitals |
| **NFR-P4** | First Input Delay (FID) < 100ms | Réactivité slider humeur |
| **NFR-P5** | Cumulative Layout Shift (CLS) < 0.1 | Stabilité visuelle |
| **NFR-P6** | Time to Interactive (TTI) < 3s | Check-in rapide dès le lancement |
| **NFR-P7** | Bundle initial < 200KB | Utilisateurs mobile data limité |

### Sécurité

| NFR | Critère | Justification |
|-----|---------|---------------|
| **NFR-S1** | Chiffrement des données au repos (AES-256) | Données santé mentale |
| **NFR-S2** | Chiffrement en transit (TLS 1.3) | Protection communication |
| **NFR-S3** | Pas de données santé dans logs/analytics | RGPD, privacy by design |
| **NFR-S4** | Suppression compte = suppression données < 30 jours | Droit à l'effacement RGPD |
| **NFR-S5** | Sessions authentifiées expirent après 30 jours d'inactivité | Sécurité sessions |
| **NFR-S6** | Politique de mot de passe: min 8 caractères | Sécurité basique |
| **NFR-S7** | Rate limiting sur endpoints sensibles (login, reset) | Protection brute force |

### Fiabilité

| NFR | Critère | Justification |
|-----|---------|---------------|
| **NFR-R1** | App fonctionnelle offline pour check-in humeur | "Repère fiable", PWA core |
| **NFR-R2** | Sync automatique sans perte de données au retour connexion | Confiance utilisateur |
| **NFR-R3** | Conflict resolution: last-write-wins avec horodatage | Simplicité MVP |
| **NFR-R4** | Indicateur visuel de l'état de synchronisation | Transparence |
| **NFR-R5** | Uptime cible: 99.5% (hors maintenance planifiée) | Disponibilité raisonnable |
| **NFR-R6** | Backup données automatique quotidien | Protection données |

### Accessibilité

| NFR | Critère | Justification |
|-----|---------|---------------|
| **NFR-A1** | Conformité WCAG 2.1 niveau AA | Standard accessibilité |
| **NFR-A2** | Contraste couleurs minimum 4.5:1 (texte normal) | Lisibilité |
| **NFR-A3** | Touch targets minimum 44x44px | Mobile-first, facilité usage |
| **NFR-A4** | Navigation clavier complète | Accessibilité motrice |
| **NFR-A5** | Labels ARIA pour tous les éléments interactifs | Screen readers |
| **NFR-A6** | Texte redimensionnable jusqu'à 200% sans perte de contenu | Déficience visuelle |
| **NFR-A7** | Pas d'interactions hover-only | Mobile & accessibilité |

### Scalabilité

| NFR | Critère | Justification |
|-----|---------|---------------|
| **NFR-SC1** | Supporter 500 utilisateurs actifs (MVP, 3 mois) | Objectif business |
| **NFR-SC2** | Supporter 10,000 utilisateurs actifs (12 mois) | Croissance prévue |
| **NFR-SC3** | Performance stable avec 10x croissance (< 10% dégradation) | Anticipation scale |
