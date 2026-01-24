---
stepsCompleted: [1, 2, 3, 4]
workflowComplete: true
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
---

# Moodday - Epic Breakdown

## Overview

Ce document contient le découpage complet en Epics et Stories pour Moodday, transformant les requirements du PRD, UX Design et Architecture en stories implémentables.

## Implementation Status Snapshot (2026-01-23)

See `PROJECT_STATUS.md` for detailed page-by-page status.

| Epic | Status | Notes |
|------|--------|-------|
| Epic 1: Auth & Account | ✅ Done | Redirects vers `/dashboard`, RGPD export + suppression OK |
| Epic 2: Mood Tracking | ✅ Done | Quick entry modal/FAB câblé + score d’anxiete UI |
| Epic 3: Medications | ⚠️ Partial | CRUD/intakes/PRN/dosage history + rappel global; pas de rappel par medicament |
| Epic 4: Therapy & Exercises | ✅ Done | CRUD + édition/suppression OK |
| Epic 5: Insights & Visualization | ✅ Mostly Done | Courbes + streak + corrélations dynamiques; IA LLM optionnelle |
| Epic 6: Export | ✅ Done | PDF export + RGPD JSON OK |
| Epic 7: Settings & Onboarding | ✅ Done | Profil + upload image + onboarding + billing portail |
| Epic 8: PWA & Offline | ✅ Mostly Done | SW + offline queues + sync + push serveur (cron a configurer) |

Note: Le système aidants est complet côté core + emailing + page d’acceptation. Permissions avancées restent à enrichir.

## Requirements Inventory

### Functional Requirements

**Auth & Users (FR1-6)**
- FR1: Inscription email/password avec vérification
- FR2: Connexion multi-provider (Email, Google, GitHub)
- FR3: Déconnexion sécurisée
- FR4: Réinitialisation mot de passe
- FR5: Suppression compte (RGPD)
- FR6: Export données personnelles (RGPD)

**Mood Tracking (FR7-11)**
- FR7: Créer mood entry (0-10 slider + note)
- FR8: Modifier mood entry existant
- FR9: Supprimer mood entry
- FR10: Voir historique mood entries
- FR11: Ajouter note libre optionnelle

**Medications (FR12-19)**
- FR12: Ajouter médicament (nom, dosage, fréquence)
- FR13: Modifier médicament
- FR14: Archiver médicament (soft delete)
- FR15: Logger prise médicament
- FR16: Support médicaments PRN (si besoin)
- FR17: Historique changements dosage
- FR18: Rappels notifications (optionnel)
- FR19: Vue liste médicaments actifs

**Therapy & Exercises (FR20-27)**
- FR20: Créer note de session thérapie
- FR21: Modifier note session
- FR22: Supprimer note session
- FR23: Évaluer bénéfice session (1-5)
- FR24: Ajouter exercice personnalisé
- FR25: Logger complétion exercice
- FR26: Voir historique exercices
- FR27: Archiver exercice

**Visualization (FR28-31)**
- FR28: Courbe humeur 30 jours
- FR29: Marqueurs changements dosage sur courbe
- FR30: Dashboard agrégé (humeur + meds + therapy)
- FR31: Insights patterns (tendances)

**Export (FR32-34)**
- FR32: Générer PDF consultation
- FR33: Sélectionner période export
- FR34: Format 1 page optimisé psy

**Settings (FR35-37)**
- FR35: Configurer notifications
- FR36: Préférences affichage
- FR37: Gérer compte

**PWA/Offline (FR38-41)**
- FR38: Installation PWA home screen
- FR39: Mode offline complet
- FR40: Sync automatique au retour online
- FR41: Indicateur état sync

**Onboarding (FR42-44)**
- FR42: Flow bienvenue multi-étapes
- FR43: Configuration médicaments initiale
- FR44: Option skip onboarding

### NonFunctional Requirements

**Performance (NFR-P1-7)**
- NFR-P1: Quick check-in < 30 secondes
- NFR-P2: LCP < 2.5 secondes
- NFR-P3: FID < 100ms
- NFR-P4: Bundle JS < 200KB initial
- NFR-P5: Temps réponse API < 500ms
- NFR-P6: Support 100 concurrent users
- NFR-P7: Offline response < 100ms

**Sécurité (NFR-S1-7)**
- NFR-S1: Chiffrement données at rest
- NFR-S2: HTTPS obligatoire
- NFR-S3: RGPD compliance
- NFR-S4: Rate limiting API
- NFR-S5: Session timeout 30 jours
- NFR-S6: Pas de données sensibles en logs
- NFR-S7: Sanitization inputs

**Fiabilité (NFR-R1-6)**
- NFR-R1: Offline-first architecture
- NFR-R2: 99.5% uptime
- NFR-R3: Conflict resolution sync
- NFR-R4: Backup automatique
- NFR-R5: Graceful degradation
- NFR-R6: Error recovery automatique

**Accessibilité (NFR-A1-4)**
- NFR-A1: WCAG 2.1 AA compliance
- NFR-A2: Touch targets 44px minimum
- NFR-A3: Navigation clavier complète
- NFR-A4: Screen reader support

**Scalabilité (NFR-SC1-3)**
- NFR-SC1: Support 500→10K users
- NFR-SC2: Auto-scaling Vercel
- NFR-SC3: Database connection pooling

### Additional Requirements

**From Architecture:**
- Serwist pour Service Worker PWA
- Dexie.js pour IndexedDB offline storage
- Recharts pour visualisations courbes
- @react-pdf/renderer pour génération PDF client-side
- Last-write-wins sync strategy avec timestamps
- Prisma schema à définir (models: User, MoodEntry, Medication, MedIntake, TherapySession, Exercise, ExerciseLog)

**From UX Design:**
- Glass-morphism design style (backdrop-blur, organic blobs)
- Bottom nav mobile + FAB central pour Quick Entry
- Quick Entry Modal optimisé < 30 secondes
- Microcopy bienveillant (zéro streak guilt)
- Components custom requis: MoodSlider, MedCheckbox, GlassCard, MoodChart, BottomNav, SyncIndicator, QuickEntryModal
- Touch targets 48px (au-dessus du minimum 44px)
- Palette: Primary #2BA09F, Sage #48A878, Lavender #D4C5E8

### FR Coverage Map

| FR Range | Epic | Description |
|----------|------|-------------|
| FR1-FR6 | Epic 1 | Authentication & Account |
| FR7-FR11 | Epic 2 | Mood Tracking |
| FR12-FR19 | Epic 3 | Medication Management |
| FR20-FR27 | Epic 4 | Therapy & Exercises |
| FR28-FR31 | Epic 5 | Insights & Visualization |
| FR32-FR34 | Epic 6 | Export PDF |
| FR35-FR37 | Epic 7 | Settings |
| FR38-FR41 | Epic 8 | PWA & Offline |
| FR42-FR44 | Epic 7 | Onboarding |

**Coverage:** 44/44 FRs (100%)

## Epic List

### Epic 1: Foundation & Authentication
Les utilisateurs peuvent créer un compte, se connecter de manière sécurisée, et gérer leurs données personnelles (RGPD).

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6
**Includes:** Prisma schema User, Better Auth setup

---

### Epic 2: Quick Mood Tracking
Les utilisateurs peuvent tracker leur humeur quotidiennement en moins de 30 secondes via le Quick Entry Modal avec slider et note optionnelle.

**FRs covered:** FR7, FR8, FR9, FR10, FR11
**Includes:** MoodSlider component, QuickEntryModal, MoodEntry model

---

### Epic 3: Medication Management
Les utilisateurs peuvent ajouter leurs médicaments, logger leurs prises quotidiennes, gérer les médicaments PRN, et suivre l'historique des changements de dosage.

**FRs covered:** FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19
**Includes:** Medication, MedIntake, MedicationHistory models, MedCheckbox component

---

### Epic 4: Therapy & Wellness
Les utilisateurs peuvent noter leurs séances de thérapie, évaluer leur bénéfice, et suivre leurs exercices de bien-être personnalisés.

**FRs covered:** FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27
**Includes:** TherapySession, Exercise, ExerciseLog models

---

### Epic 5: Insights & Visualization
Les utilisateurs peuvent visualiser leur courbe d'humeur sur 30 jours avec les marqueurs de changement de dosage, et voir les patterns/tendances.

**FRs covered:** FR28, FR29, FR30, FR31
**Includes:** MoodChart (Recharts), Dashboard agrégé, InsightCard

---

### Epic 6: Export for Consultation
Les utilisateurs peuvent générer un PDF optimisé pour montrer à leur psychiatre/psychologue lors des consultations.

**FRs covered:** FR32, FR33, FR34
**Includes:** @react-pdf/renderer, date range selector

---

### Epic 7: Personalization & Onboarding
Les utilisateurs peuvent personnaliser leurs préférences (notifications, affichage) et découvrir l'app via un onboarding bienveillant avec setup médicaments.

**FRs covered:** FR35, FR36, FR37, FR42, FR43, FR44
**Includes:** Settings page, Onboarding wizard

---

### Epic 8: PWA & Offline Experience
Les utilisateurs peuvent installer l'app sur leur home screen et l'utiliser complètement hors ligne avec synchronisation automatique au retour.

**FRs covered:** FR38, FR39, FR40, FR41
**Includes:** Serwist setup, Dexie.js offline store, SyncIndicator

---

## Stories

### Epic 1: Foundation & Authentication

#### Story 1.1: Project Setup from Boilerplate
**En tant qu'** équipe de développement,
**Je veux** initialiser le projet Moodday à partir du boilerplate light-ts existant,
**Afin de** disposer d'une base solide avec auth, DB et design system déjà configurés.

**FRs:** Prérequis pour FR1-FR6
**Points:** 2

**Acceptance Criteria:**
- [ ] Projet cloné et renommé "moodday"
- [ ] Variables d'environnement configurées (DATABASE_URL, AUTH secrets)
- [ ] `pnpm install` et `pnpm dev` fonctionnent
- [ ] Page d'accueil accessible sur localhost:3000
- [ ] Better Auth configuré avec providers (Email, Google, GitHub)

**Technical Notes:**
- Boilerplate inclut: Next.js 16.1.1, React 19.1.1, Prisma 5.19.1, Better Auth 1.3.11
- Vérifier que TailwindCSS v4 fonctionne correctement

---

#### Story 1.2: Multi-Provider Authentication
**En tant qu'** utilisateur,
**Je veux** pouvoir m'inscrire et me connecter via Email, Google ou GitHub,
**Afin de** choisir la méthode la plus pratique pour moi.

**FRs:** FR1, FR2
**Points:** 3

**Acceptance Criteria:**
- [ ] Inscription email/password avec vérification email
- [ ] Connexion Google OAuth fonctionnelle
- [ ] Connexion GitHub OAuth fonctionnelle
- [ ] Formulaires avec validation Zod
- [ ] Messages d'erreur bienveillants (pas de jugement)
- [ ] Redirection post-login vers dashboard

**Technical Notes:**
- Utiliser Better Auth existant du boilerplate
- Schemas: `src/features/auth/auth.schema.ts`
- Server Actions: `src/features/auth/auth.action.ts`

---

#### Story 1.3: Session Management & Logout
**En tant qu'** utilisateur connecté,
**Je veux** pouvoir me déconnecter de manière sécurisée,
**Afin de** protéger mes données sur un appareil partagé.

**FRs:** FR3
**Points:** 1

**Acceptance Criteria:**
- [ ] Bouton de déconnexion visible dans le header/menu
- [ ] Session invalidée côté serveur au logout
- [ ] Redirection vers page d'accueil après logout
- [ ] Session timeout configuré à 30 jours (NFR-S5)

**Technical Notes:**
- Utiliser `signOut()` de Better Auth
- Nettoyer le cache local (IndexedDB) au logout

---

#### Story 1.4: Password Reset Flow
**En tant qu'** utilisateur,
**Je veux** pouvoir réinitialiser mon mot de passe si je l'oublie,
**Afin de** retrouver l'accès à mon compte.

**FRs:** FR4
**Points:** 2

**Acceptance Criteria:**
- [ ] Lien "Mot de passe oublié" sur page de login
- [ ] Formulaire de demande de reset avec email
- [ ] Email de réinitialisation envoyé (Resend)
- [ ] Page de reset avec nouveau mot de passe
- [ ] Token de reset expire après 1h
- [ ] Message de confirmation bienveillant

**Technical Notes:**
- Utiliser Better Auth password reset flow
- Template email: `emails/password-reset.tsx`

---

#### Story 1.5: Account Deletion (RGPD)
**En tant qu'** utilisateur,
**Je veux** pouvoir supprimer définitivement mon compte et toutes mes données,
**Afin de** exercer mon droit à l'oubli (RGPD).

**FRs:** FR5
**Points:** 2

**Acceptance Criteria:**
- [ ] Option "Supprimer mon compte" dans Settings
- [ ] Modal de confirmation avec avertissement clair
- [ ] Saisie du mot de passe pour confirmer
- [ ] Suppression cascade de toutes les données (MoodEntry, Medications, etc.)
- [ ] Email de confirmation de suppression
- [ ] Déconnexion automatique après suppression

**Technical Notes:**
- Cascade delete dans Prisma schema
- Server Action: `deleteAccount` avec safe-actions
- NFR-S3: Compliance RGPD

---

#### Story 1.6: Personal Data Export (RGPD)
**En tant qu'** utilisateur,
**Je veux** pouvoir exporter toutes mes données personnelles,
**Afin de** exercer mon droit à la portabilité (RGPD).

**FRs:** FR6
**Points:** 3

**Acceptance Criteria:**
- [ ] Bouton "Exporter mes données" dans Settings
- [ ] Génération JSON avec toutes les données utilisateur
- [ ] Inclut: profil, moods, medications, therapy, exercises
- [ ] Téléchargement automatique du fichier
- [ ] Données lisibles et structurées

**Technical Notes:**
- Server Action: `exportUserData`
- Format JSON pour interopérabilité

---

### Epic 2: Quick Mood Tracking

#### Story 2.1: Prisma Schema MoodEntry
**En tant que** développeur,
**Je veux** créer le modèle MoodEntry dans Prisma,
**Afin de** stocker les entrées d'humeur des utilisateurs.

**FRs:** Prérequis pour FR7-FR11
**Points:** 1

**Acceptance Criteria:**
- [ ] Model MoodEntry créé dans schema.prisma
- [ ] Champs: id, userId, value (0-10), note (optionnel), createdAt, updatedAt
- [ ] Champ syncStatus pour offline: 'pending' | 'synced' | 'conflict'
- [ ] Relation avec User (cascade delete)
- [ ] Migration exécutée avec succès

**Technical Notes:**
```prisma
model MoodEntry {
  id         String   @id @default(cuid())
  userId     String
  value      Int      // 0-10
  note       String?
  syncStatus String   @default("synced")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

#### Story 2.2: MoodSlider Component
**En tant qu'** utilisateur,
**Je veux** un slider fluide et intuitif pour saisir mon humeur de 0 à 10,
**Afin de** pouvoir entrer ma donnée rapidement sans réfléchir.

**FRs:** FR7 (partie UI)
**Points:** 2

**Acceptance Criteria:**
- [ ] Slider horizontal avec range 0-10
- [ ] Affichage de la valeur actuelle
- [ ] Couleurs graduelles (rouge→jaune→vert) selon la valeur
- [ ] Touch target 48px minimum (NFR-A2)
- [ ] Feedback haptique sur mobile (si supporté)
- [ ] Style glass-morphism cohérent avec UX Design
- [ ] Accessible clavier (arrow keys)

**Technical Notes:**
- Composant: `src/components/nowts/mood-slider.tsx`
- Utiliser @radix-ui/react-slider comme base
- Palette: Primary #2BA09F

---

#### Story 2.3: Quick Entry Modal
**En tant qu'** utilisateur,
**Je veux** un modal rapide pour saisir mon humeur et une note optionnelle,
**Afin de** compléter mon check-in en moins de 30 secondes.

**FRs:** FR7, FR11
**Points:** 3

**Acceptance Criteria:**
- [ ] Modal accessible via FAB central (Bottom Nav)
- [ ] MoodSlider intégré
- [ ] Zone de texte optionnelle pour note libre
- [ ] Bouton "Enregistrer" visible et accessible
- [ ] Animation fluide d'ouverture/fermeture
- [ ] Fermeture au tap outside ou swipe down
- [ ] Temps total de saisie < 30 secondes (NFR-P1)

**Technical Notes:**
- Composant: `src/components/nowts/quick-entry-modal.tsx`
- Server Action: `createMoodEntry` dans `mood.action.ts`
- Utiliser Zustand pour état du modal

---

#### Story 2.4: Mood Entry CRUD Operations
**En tant qu'** utilisateur,
**Je veux** pouvoir modifier ou supprimer une entrée d'humeur existante,
**Afin de** corriger une erreur de saisie.

**FRs:** FR8, FR9
**Points:** 2

**Acceptance Criteria:**
- [ ] Tap sur une entrée ouvre le modal d'édition
- [ ] Valeur et note pré-remplies
- [ ] Bouton "Supprimer" avec confirmation
- [ ] Message de confirmation bienveillant (pas de culpabilisation)
- [ ] Mise à jour immédiate de l'affichage

**Technical Notes:**
- Server Actions: `updateMoodEntry`, `deleteMoodEntry`
- Optimistic updates avec TanStack Query

---

#### Story 2.5: Mood History List
**En tant qu'** utilisateur,
**Je veux** voir l'historique de mes entrées d'humeur,
**Afin de** visualiser mon parcours dans le temps.

**FRs:** FR10
**Points:** 2

**Acceptance Criteria:**
- [ ] Liste chronologique inversée (récent en haut)
- [ ] Affichage: date, valeur (avec couleur), note (preview)
- [ ] Pagination ou infinite scroll
- [ ] Filtre par période (7j, 30j, 90j, tout)
- [ ] État vide bienveillant si aucune entrée

**Technical Notes:**
- Page: `app/(dashboard)/mood/history/page.tsx`
- Composant: `MoodHistoryList`

---

### Epic 3: Medication Management

#### Story 3.1: Prisma Schema Medications
**En tant que** développeur,
**Je veux** créer les modèles Medication, MedIntake et MedicationHistory,
**Afin de** stocker les médicaments et leurs prises.

**FRs:** Prérequis pour FR12-FR19
**Points:** 2

**Acceptance Criteria:**
- [ ] Model Medication: id, userId, name, dosage, frequency, isPRN, isArchived, createdAt
- [ ] Model MedIntake: id, medicationId, takenAt, skipped, note
- [ ] Model MedicationHistory: id, medicationId, dosage, changedAt, reason
- [ ] Relations correctes avec cascade delete
- [ ] Migration exécutée

**Technical Notes:**
```prisma
model Medication {
  id         String   @id @default(cuid())
  userId     String
  name       String
  dosage     String
  frequency  String   // "daily", "twice_daily", "weekly", "prn"
  isPRN      Boolean  @default(false)
  isArchived Boolean  @default(false)
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  intakes    MedIntake[]
  history    MedicationHistory[]
}
```

---

#### Story 3.2: Add Medication Form
**En tant qu'** utilisateur,
**Je veux** ajouter un nouveau médicament avec son nom, dosage et fréquence,
**Afin de** configurer mon suivi médicamenteux.

**FRs:** FR12
**Points:** 2

**Acceptance Criteria:**
- [ ] Formulaire: nom, dosage (texte libre), fréquence (select)
- [ ] Options fréquence: quotidien, 2x/jour, hebdo, PRN
- [ ] Checkbox "Médicament PRN (si besoin)"
- [ ] Validation Zod des champs
- [ ] Message de succès bienveillant
- [ ] Redirection vers liste après ajout

**Technical Notes:**
- Page: `app/(dashboard)/medications/new/page.tsx`
- Server Action: `createMedication`

---

#### Story 3.3: Medication List View
**En tant qu'** utilisateur,
**Je veux** voir la liste de mes médicaments actifs,
**Afin de** avoir une vue d'ensemble de mon traitement.

**FRs:** FR19
**Points:** 2

**Acceptance Criteria:**
- [ ] Liste des médicaments non-archivés
- [ ] Affichage: nom, dosage, fréquence, badge PRN si applicable
- [ ] Indicateur de prise du jour (pris/non pris)
- [ ] Accès rapide à la modification
- [ ] État vide encourageant si pas de médicaments

**Technical Notes:**
- Page: `app/(dashboard)/medications/page.tsx`
- Composant: `MedicationCard`

---

#### Story 3.4: Edit & Archive Medication
**En tant qu'** utilisateur,
**Je veux** modifier ou archiver un médicament,
**Afin de** ajuster mon traitement sans perdre l'historique.

**FRs:** FR13, FR14
**Points:** 2

**Acceptance Criteria:**
- [ ] Page d'édition avec formulaire pré-rempli
- [ ] Bouton "Archiver" (soft delete)
- [ ] Archivage conserve l'historique des prises
- [ ] Médicament archivé n'apparaît plus dans la liste active
- [ ] Possibilité de voir les médicaments archivés

**Technical Notes:**
- Server Actions: `updateMedication`, `archiveMedication`
- Page: `app/(dashboard)/medications/[id]/edit/page.tsx`

---

#### Story 3.5: Log Medication Intake
**En tant qu'** utilisateur,
**Je veux** logger la prise de mes médicaments quotidiens,
**Afin de** suivre mon observance.

**FRs:** FR15
**Points:** 3

**Acceptance Criteria:**
- [ ] Checkbox pour chaque médicament du jour
- [ ] État: pris / non pris / sauté (avec raison optionnelle)
- [ ] Horodatage automatique de la prise
- [ ] Intégration dans Quick Entry Modal (section médicaments)
- [ ] Feedback visuel immédiat (checkmark animé)

**Technical Notes:**
- Composant: `MedCheckbox` dans `src/components/nowts/`
- Server Action: `logMedIntake`

---

#### Story 3.6: PRN Medication Support
**En tant qu'** utilisateur,
**Je veux** pouvoir logger mes médicaments PRN quand je les prends,
**Afin de** suivre l'utilisation de mes traitements "si besoin".

**FRs:** FR16
**Points:** 2

**Acceptance Criteria:**
- [ ] Section séparée pour PRN dans Quick Entry
- [ ] Bouton "J'ai pris [nom PRN]"
- [ ] Possibilité de noter la raison de la prise
- [ ] Historique des prises PRN visible
- [ ] Pas de notification/rappel pour PRN

**Technical Notes:**
- PRN = "Pro Re Nata" (si besoin)
- Filtrer par `isPRN: true`

---

#### Story 3.7: Dosage Change History
**En tant qu'** utilisateur,
**Je veux** voir l'historique des changements de dosage de mes médicaments,
**Afin de** corréler avec l'évolution de mon humeur.

**FRs:** FR17
**Points:** 2

**Acceptance Criteria:**
- [ ] Timeline des changements pour chaque médicament
- [ ] Affichage: date, ancien dosage → nouveau dosage, raison
- [ ] Création automatique d'un historique lors d'un changement de dosage
- [ ] Données utilisées dans la courbe (Epic 5)

**Technical Notes:**
- Server Action: Créer MedicationHistory à chaque update de dosage
- Composant: `DosageTimeline`

---

#### Story 3.8: Medication Reminders (Optional)
**En tant qu'** utilisateur,
**Je veux** configurer des rappels pour prendre mes médicaments,
**Afin de** ne pas oublier mes prises.

**FRs:** FR18
**Points:** 3

**Acceptance Criteria:**
- [ ] Option d'activer les rappels par médicament
- [ ] Configuration des heures de rappel
- [ ] Notification push PWA
- [ ] Respect du "pas de pression" - rappels doux
- [ ] Possibilité de désactiver facilement

**Technical Notes:**
- Utiliser Web Push API via Service Worker (Serwist)
- Stocker préférences dans User model

---

### Epic 4: Therapy & Wellness

#### Story 4.1: Prisma Schema Therapy & Exercises
**En tant que** développeur,
**Je veux** créer les modèles TherapySession, Exercise et ExerciseLog,
**Afin de** stocker les notes de thérapie et exercices de bien-être.

**FRs:** Prérequis pour FR20-FR27
**Points:** 1

**Acceptance Criteria:**
- [ ] Model TherapySession: id, userId, date, notes, benefitRating (1-5), createdAt
- [ ] Model Exercise: id, userId, name, description, isArchived
- [ ] Model ExerciseLog: id, exerciseId, completedAt, note
- [ ] Relations et cascade delete
- [ ] Migration exécutée

---

#### Story 4.2: Create Therapy Session Note
**En tant qu'** utilisateur,
**Je veux** noter mes séances de thérapie avec mes observations,
**Afin de** garder une trace de mon suivi psy.

**FRs:** FR20, FR23
**Points:** 2

**Acceptance Criteria:**
- [ ] Formulaire: date, notes (textarea), rating bénéfice (1-5 étoiles)
- [ ] Questions guidantes optionnelles ("Comment vous êtes-vous senti après ?")
- [ ] Sauvegarde rapide
- [ ] Message d'encouragement post-saisie

**Technical Notes:**
- Page: `app/(dashboard)/therapy/new/page.tsx`
- Composant: `BenefitRating` (étoiles ou slider 1-5)

---

#### Story 4.3: Therapy Session CRUD
**En tant qu'** utilisateur,
**Je veux** modifier ou supprimer une note de séance,
**Afin de** compléter ou corriger mes notes.

**FRs:** FR21, FR22
**Points:** 2

**Acceptance Criteria:**
- [ ] Liste des séances avec preview
- [ ] Tap pour voir/éditer
- [ ] Suppression avec confirmation douce
- [ ] Historique chronologique

**Technical Notes:**
- Server Actions: `updateTherapySession`, `deleteTherapySession`

---

#### Story 4.4: Add Custom Exercise
**En tant qu'** utilisateur,
**Je veux** ajouter mes propres exercices de bien-être personnalisés,
**Afin de** suivre les activités recommandées par mon thérapeute.

**FRs:** FR24
**Points:** 2

**Acceptance Criteria:**
- [ ] Formulaire: nom, description optionnelle
- [ ] Exemples suggérés (respiration, méditation, marche...)
- [ ] Pas de liste prédéfinie imposée
- [ ] Ajout rapide

**Technical Notes:**
- Page: `app/(dashboard)/exercises/new/page.tsx`

---

#### Story 4.5: Log Exercise Completion
**En tant qu'** utilisateur,
**Je veux** logger quand je fais un exercice de bien-être,
**Afin de** suivre ma régularité.

**FRs:** FR25
**Points:** 2

**Acceptance Criteria:**
- [ ] Liste des exercices avec bouton "Fait"
- [ ] Horodatage automatique
- [ ] Note optionnelle sur le ressenti
- [ ] Feedback positif et bienveillant
- [ ] PAS de streak/compteur culpabilisant

**Technical Notes:**
- Server Action: `logExerciseCompletion`

---

#### Story 4.6: Exercise History & Archive
**En tant qu'** utilisateur,
**Je veux** voir l'historique de mes exercices et pouvoir en archiver,
**Afin de** visualiser ma progression et nettoyer ma liste.

**FRs:** FR26, FR27
**Points:** 2

**Acceptance Criteria:**
- [ ] Historique par exercice (calendrier ou liste)
- [ ] Archivage d'exercices obsolètes
- [ ] Conservation de l'historique après archivage
- [ ] Filtres par période

---

### Epic 5: Insights & Visualization

#### Story 5.1: MoodChart Component (30 Days)
**En tant qu'** utilisateur,
**Je veux** voir une courbe de mon humeur sur les 30 derniers jours,
**Afin de** visualiser les tendances et patterns.

**FRs:** FR28
**Points:** 3

**Acceptance Criteria:**
- [ ] Graphique linéaire avec Recharts
- [ ] Axe X: dates (30 jours)
- [ ] Axe Y: humeur (0-10)
- [ ] Points interactifs (tap pour détails)
- [ ] Ligne de tendance optionnelle
- [ ] Style glass-morphism cohérent
- [ ] Responsive mobile

**Technical Notes:**
- Composant: `src/components/nowts/mood-chart.tsx`
- Utiliser Recharts `<LineChart>`
- Couleurs de la palette UX

---

#### Story 5.2: Dosage Markers on Chart
**En tant qu'** utilisateur,
**Je veux** voir les changements de dosage marqués sur ma courbe d'humeur,
**Afin de** corréler traitement et humeur visuellement.

**FRs:** FR29
**Points:** 2

**Acceptance Criteria:**
- [ ] Marqueurs verticaux aux dates de changement de dosage
- [ ] Info-bulle au tap: "Lamictal: 100mg → 150mg"
- [ ] Couleur distincte des points d'humeur
- [ ] Légende explicative

**Technical Notes:**
- Utiliser Recharts `<ReferenceLine>` ou custom markers
- Query: join MoodEntry + MedicationHistory

---

#### Story 5.3: Aggregated Dashboard
**En tant qu'** utilisateur,
**Je veux** un dashboard central montrant humeur, médicaments et thérapie,
**Afin de** avoir une vue 360° de ma santé mentale.

**FRs:** FR30
**Points:** 3

**Acceptance Criteria:**
- [ ] Section humeur: moyenne semaine, mini-courbe
- [ ] Section médicaments: observance %, prises du jour
- [ ] Section thérapie: dernière séance, prochain RDV (si noté)
- [ ] Section exercices: activité récente
- [ ] Design GlassCard cohérent
- [ ] Chargement rapide (LCP < 2.5s - NFR-P2)

**Technical Notes:**
- Page: `app/(dashboard)/page.tsx`
- Composant: `DashboardSummary`
- Parallel data fetching pour performance

---

#### Story 5.4: Pattern Insights
**En tant qu'** utilisateur,
**Je veux** voir des insights sur mes patterns et tendances,
**Afin de** mieux comprendre mon fonctionnement.

**FRs:** FR31
**Points:** 3

**Acceptance Criteria:**
- [ ] Insights générés automatiquement (pas d'IA pour MVP)
- [ ] Exemples: "Humeur moyenne plus haute le weekend"
- [ ] "Observance médicaments: 85% ce mois"
- [ ] "3 séances de thérapie ce mois (vs 2 le mois dernier)"
- [ ] Ton positif et encourageant
- [ ] Pas de jugement sur les "mauvais" patterns

**Technical Notes:**
- Composant: `InsightCard`
- Calculs côté serveur (Server Components)
- Logique simple basée sur moyennes/comparaisons

---

### Epic 6: Export for Consultation

#### Story 6.1: Date Range Selector
**En tant qu'** utilisateur,
**Je veux** sélectionner une période pour mon export PDF,
**Afin de** choisir les données pertinentes pour ma consultation.

**FRs:** FR33
**Points:** 1

**Acceptance Criteria:**
- [ ] Sélecteur date début / date fin
- [ ] Presets: 2 semaines, 1 mois, 3 mois
- [ ] Preview du nombre d'entrées dans la période
- [ ] Validation: fin > début

**Technical Notes:**
- Composant: DateRangePicker
- Utiliser date-fns pour manipulations

---

#### Story 6.2: PDF Generation
**En tant qu'** utilisateur,
**Je veux** générer un PDF avec mes données de la période sélectionnée,
**Afin de** le montrer à mon psychiatre/psychologue.

**FRs:** FR32, FR34
**Points:** 5

**Acceptance Criteria:**
- [ ] Génération client-side avec @react-pdf/renderer
- [ ] Format 1 page optimisé (ou 2 max si beaucoup de données)
- [ ] Sections: Résumé humeur, Courbe, Médicaments, Thérapie
- [ ] Design professionnel mais lisible
- [ ] Nom patient et période en header
- [ ] Téléchargement automatique du fichier

**Technical Notes:**
- Composant: `src/features/export/pdf-document.tsx`
- Library: @react-pdf/renderer
- Pas de génération serveur pour éviter les limites serverless

---

#### Story 6.3: Export Preview
**En tant qu'** utilisateur,
**Je veux** prévisualiser mon PDF avant de le télécharger,
**Afin de** vérifier qu'il contient les bonnes informations.

**FRs:** FR32 (amélioration UX)
**Points:** 2

**Acceptance Criteria:**
- [ ] Preview dans un modal ou page dédiée
- [ ] Rendu identique au PDF final
- [ ] Boutons: "Télécharger" / "Modifier période"
- [ ] Loading state pendant génération

---

### Epic 7: Personalization & Onboarding

#### Story 7.1: Onboarding Welcome Flow
**En tant que** nouvel utilisateur,
**Je veux** un onboarding bienveillant qui m'accueille,
**Afin de** comprendre comment utiliser l'app sans pression.

**FRs:** FR42
**Points:** 2

**Acceptance Criteria:**
- [ ] 3-4 écrans d'introduction maximum
- [ ] Ton chaleureux et rassurant
- [ ] Explication de la valeur: "Voir si votre traitement fonctionne"
- [ ] Pas de promesses médicales
- [ ] Navigation: Next / Skip

**Technical Notes:**
- Pages: `app/(auth)/onboarding/[step]/page.tsx`
- Stocker progression onboarding dans User

---

#### Story 7.2: Initial Medication Setup
**En tant que** nouvel utilisateur,
**Je veux** configurer mes médicaments pendant l'onboarding,
**Afin de** démarrer mon suivi immédiatement.

**FRs:** FR43
**Points:** 2

**Acceptance Criteria:**
- [ ] Étape dédiée dans l'onboarding
- [ ] Ajout rapide de médicaments (nom + dosage)
- [ ] "Ajouter un autre" ou "Continuer"
- [ ] Option "Je n'en prends pas" ou "Plus tard"
- [ ] Pas obligatoire

**Technical Notes:**
- Réutiliser composants de Epic 3

---

#### Story 7.3: Skip Onboarding Option
**En tant que** nouvel utilisateur pressé,
**Je veux** pouvoir sauter l'onboarding,
**Afin d'** accéder directement à l'app.

**FRs:** FR44
**Points:** 1

**Acceptance Criteria:**
- [ ] Bouton "Passer" visible mais discret
- [ ] Confirmation douce ("Vous pourrez configurer plus tard")
- [ ] Redirection vers dashboard
- [ ] Onboarding marqué comme complété

---

#### Story 7.4: Notification Preferences
**En tant qu'** utilisateur,
**Je veux** configurer mes préférences de notifications,
**Afin de** choisir quand et comment être rappelé.

**FRs:** FR35
**Points:** 2

**Acceptance Criteria:**
- [ ] Toggle global notifications on/off
- [ ] Rappel check-in quotidien (heure configurable)
- [ ] Rappels médicaments (par médicament)
- [ ] Choix: Push uniquement (pas d'email/SMS)
- [ ] Demande permission notification browser

**Technical Notes:**
- Stocker dans User preferences (JSON field ou table dédiée)

---

#### Story 7.5: Display Preferences
**En tant qu'** utilisateur,
**Je veux** personnaliser l'affichage de l'app,
**Afin de** l'adapter à mes préférences visuelles.

**FRs:** FR36
**Points:** 1

**Acceptance Criteria:**
- [ ] Mode clair / Mode sombre
- [ ] Période par défaut pour la courbe (7j, 30j, 90j)
- [ ] Sauvegarde en localStorage + User profile

**Technical Notes:**
- Utiliser next-themes si pas déjà présent
- Préférence système par défaut

---

#### Story 7.6: Account Management
**En tant qu'** utilisateur,
**Je veux** gérer les informations de mon compte,
**Afin de** garder mon profil à jour.

**FRs:** FR37
**Points:** 2

**Acceptance Criteria:**
- [ ] Modifier email (avec re-vérification)
- [ ] Modifier mot de passe
- [ ] Voir providers connectés
- [ ] Lien vers suppression compte (Story 1.5)
- [ ] Lien vers export données (Story 1.6)

**Technical Notes:**
- Page: `app/(dashboard)/settings/account/page.tsx`

---

### Epic 8: PWA & Offline Experience

#### Story 8.1: PWA Installation
**En tant qu'** utilisateur,
**Je veux** installer Moodday sur mon écran d'accueil,
**Afin d'** y accéder comme une app native.

**FRs:** FR38
**Points:** 2

**Acceptance Criteria:**
- [ ] Manifest.json configuré (nom, icônes, couleurs)
- [ ] Service Worker avec Serwist
- [ ] Prompt d'installation sur mobile
- [ ] App fonctionne en standalone
- [ ] Splash screen au lancement

**Technical Notes:**
- Serwist config: `src/lib/serwist.ts`
- Icônes: 192x192, 512x512
- Theme color: #2BA09F

---

#### Story 8.2: Offline Data Storage
**En tant qu'** utilisateur,
**Je veux** utiliser l'app même sans connexion internet,
**Afin de** tracker mon humeur n'importe où.

**FRs:** FR39
**Points:** 5

**Acceptance Criteria:**
- [ ] IndexedDB avec Dexie.js pour stockage local
- [ ] MoodEntry, MedIntake sauvés localement en offline
- [ ] Lecture des données offline
- [ ] Quick Entry fonctionne complètement offline
- [ ] Interface identique online/offline

**Technical Notes:**
- Dexie schema: mirrors Prisma models
- Composant: `src/lib/offline/dexie-db.ts`
- Hook: `use-offline-data.ts`

---

#### Story 8.3: Auto Sync on Reconnection
**En tant qu'** utilisateur,
**Je veux** que mes données offline se synchronisent automatiquement,
**Afin de** ne rien perdre quand je retrouve internet.

**FRs:** FR40
**Points:** 5

**Acceptance Criteria:**
- [ ] Détection automatique du retour online
- [ ] Sync des entrées pending vers le serveur
- [ ] Stratégie last-write-wins (timestamp)
- [ ] Gestion des conflits (garder le plus récent)
- [ ] Pas de duplicatas
- [ ] Sync silencieuse (pas de popup intrusive)

**Technical Notes:**
- Utiliser `navigator.onLine` + event listeners
- Server Actions pour sync batch
- Champ `syncStatus` sur les entrées locales

---

#### Story 8.4: Sync Status Indicator
**En tant qu'** utilisateur,
**Je veux** voir l'état de synchronisation de mes données,
**Afin de** savoir si tout est bien sauvegardé.

**FRs:** FR41
**Points:** 2

**Acceptance Criteria:**
- [ ] Indicateur discret dans le header/footer
- [ ] États: "Synchronisé" ✓, "En cours..." ↻, "Hors ligne" ⚡
- [ ] Tap pour voir détails (X entrées en attente)
- [ ] Pas d'alarme anxiogène si offline
- [ ] Message rassurant: "Vos données sont en sécurité"

**Technical Notes:**
- Composant: `src/components/nowts/sync-indicator.tsx`
- Zustand store pour état sync global

---

## Validation Summary

### FR Coverage: 44/44 (100%)

| Epic | Stories | FRs Covered |
|------|---------|-------------|
| Epic 1 | 6 | FR1-FR6 |
| Epic 2 | 5 | FR7-FR11 |
| Epic 3 | 8 | FR12-FR19 |
| Epic 4 | 6 | FR20-FR27 |
| Epic 5 | 4 | FR28-FR31 |
| Epic 6 | 3 | FR32-FR34 |
| Epic 7 | 6 | FR35-FR37, FR42-FR44 |
| Epic 8 | 4 | FR38-FR41 |

**Total: 42 stories**

### Dependencies Flow

```
Epic 1 (Auth) → Required first
     ↓
Epic 2 (Mood) ─┬→ Epic 5 (Insights) → Epic 6 (Export)
Epic 3 (Meds) ─┤
Epic 4 (Therapy)┘
     ↓
Epic 7 (Settings/Onboarding) - Can start after Epic 1
Epic 8 (PWA/Offline) - Can start after Epic 2
```

### Implementation Order Recommendation

1. **Sprint 1**: Epic 1 (Auth) + Epic 8.1 (PWA base)
2. **Sprint 2**: Epic 2 (Mood) + Epic 8.2-8.3 (Offline)
3. **Sprint 3**: Epic 3 (Meds)
4. **Sprint 4**: Epic 4 (Therapy) + Epic 5 (Insights)
5. **Sprint 5**: Epic 6 (Export) + Epic 7 (Settings)
6. **Sprint 6**: Polish, Epic 8.4, Tests
