# Moodday - Project Status (2026-01-23)

## Statut Global

| Catégorie | Pourcentage | Notes |
|-----------|-------------|-------|
| Server Actions | ~98% | Push serveur + cron route en place; reste la config env/cron | 
| Frontend E2E | ~90% | Flows clefs cables; IA journal optionnelle | 
| PWA/Offline | ~80% | SW + offline queues + sync + push serveur (pas d'IndexedDB/conflits) | 
| UI connectee DB | ~95% | Quick entry, onboarding, billing, theme Zen, avatar upload, notif meds horaires | 

---

## Phase 1 : Fixes Critiques UX ✅ COMPLETEE

### 1.1 Auth Redirect ✅
- [x] `/app` → `/dashboard` dans middleware & auth flows

### 1.2 Dashboard - Medicaments ✅
- [x] `getTodayIntakes()` branche
- [x] Toggle prise/skip fonctionnel

### 1.3 Mood Tracking (Journal) ✅
- [x] JournalWizard connecte a `saveMoodEntry()`
- [x] Champs persistes : mood, energie, sommeil (heures + qualite), perturbations sommeil, tags, effets secondaires
- [x] Score d’anxiete expose dans l’UI

### 1.4 Dashboard - Streak ✅
- [x] `getStreakData()` en place
- [x] Dashboard branche aux vraies donnees

### 1.5 Dashboard - Aidants ✅
- [x] Quick view “Mes aidants” branchee a la DB

---

## Phase 2 : CRUD UI ✅ COMPLETEE

### 2.1 Therapy ✅
- [x] Edition session (modal)
- [x] Suppression avec confirmation

### 2.2 Exercises ✅
- [x] Edition exercice (modal)
- [x] Archive / unarchive

### 2.3 Caregiver Forms ✅
- [x] Selection du patient dans `/caregiver/observe`
- [x] Creation observation + evenement fonctionnels

---

## Phase 3 : Systeme Aidants ✅ COMPLETE

### 3.1 Modele CaregiverRelationship ✅
- [x] Relation patient/caregiver + permissions
- [x] `caregiverEmail` ajoute (invites sans compte)

### 3.2 Actions ✅
- [x] invite/accept/decline gerent les cas “utilisateur inexistant”
- [x] Permissions verifiees pour observations & evenements

### 3.3 UI ✅
- [x] “Mon cercle” dynamique
- [x] Invite dialog + suppression
- [x] Liste “Mes patients” visible pour les aidants

### 3.4 Email + Acceptation ✅
- [x] Envoi email d’invitation (Resend)
- [x] Page publique d’acceptation/decline

---

## Phase 4 : Settings & RGPD ✅ COMPLETE

### 4.1 Profil ✅
- [x] Nom modifiable
- [x] Fuseau horaire sauvegarde (UserPreferences)
- [x] Upload image (Vercel Blob) + sauvegarde profil

### 4.2 Apparence ✅
- [x] Theme light/dark/zen persiste (UserPreferences + next-themes)

### 4.3 Subscription ✅
- [x] Donnees reelles affichees si subscription existe
- [x] Portail Stripe (changer de plan / annuler)

### 4.4 RGPD ✅
- [x] Export JSON complet
- [x] Suppression compte avec confirmation

---

## Phase 5 : Onboarding ✅ COMPLETE

- [x] Wizard multi-etapes (humeur + anxiete, traitement, preferences, invite aidant)
- [x] Sauvegarde des donnees a chaque etape
- [x] Completion -> redirection dashboard

---

## Phase 6 : PWA / Offline ✅ PARTIEL

- [x] Manifest + Service Worker
- [x] Page offline
- [x] Queue offline (humeur + actions meds/exercises/therapy)
- [x] Sync automatique au retour en ligne
- [x] Indicateur de sync (badge)
- [x] Notifications locales (check-in + medicaments)
- [x] Push notifications serveur (VAPID + endpoints + cron route)
- [ ] Offline sync avance (IndexedDB + conflits) + rappels par medicament

---

## Phase 7 : Insights & Analytics ✅ PARTIEL

- [x] Charts connectes DB
- [x] Correlations dynamiques (sommeil, energie, adherence)
- [x] Observation IA journal (optionnel, fallback heuristique)
- [ ] Insights IA LLM dashboard/trends (optionnel)

---

## Fonctionnel End-to-End (Data Reelle)

| Feature | Statut | Notes |
|---------|--------|-------|
| Auth (signup/signin/logout) | ✅ | Multi-provider OK |
| Mood quick entry (FAB + modal) | ✅ | Cables + offline queue |
| Journal detaille | ✅ | Persistance reelle |
| Historique humeur | ✅ | CRUD OK |
| Medicaments CRUD | ✅ | Ajout/edition/archivage |
| Medicaments du jour | ✅ | Intakes + PRN |
| Therapie CRUD | ✅ | Edition/suppression OK |
| Exercices CRUD | ✅ | Edition/archivage OK |
| Insights chart | ✅ | Recharts + dosage markers |
| Streak | ✅ | `getStreakData()` |
| Caregiver circle | ✅ | DB + invites + permissions |
| Export PDF | ✅ | `/export` |
| Export JSON | ✅ | RGPD |
| Preferences (notif + display) | ✅ | Persistees |
| Profil (nom + timezone + image) | ✅ | Persiste |
| Theme light/dark/zen | ✅ | Persiste |
| Subscription management | ✅ | Stripe portal branche |
| PWA offline mood | ✅ | Queue + sync |
| Offline sync meds/exercises/therapy | ✅ | Queue + sync (localStorage) |
| Notifications locales | ✅ | Check-in + medicaments |
| Push notifications serveur | ✅ | VAPID + endpoints + cron (config requise) |
| Observation IA journal | ✅ | LLM optionnel (fallback heuristique) |

---

## Restant a Faire (Roadmap)

### Priorite Haute
1. Configurer VAPID + cron en production (scheduling fiable)
2. Rappels medicaments par traitement + horaires multiples
3. Offline sync avance (IndexedDB + conflits + background sync)
4. Nettoyage UX offline (etat de sync, conflits)

### Priorite Moyenne
5. Insights IA LLM dashboard/trends (resume + recommandations)
6. Personnalisation avancée des notifications (fenetres horaires, snooze)

### Priorite Basse
6. Admin dashboard a adapter / masquer
7. Ameliorations PWA (background sync avancé)

---

## Schema Prisma – Changements Recents

- `MoodEntry` : ajout `sleepDisturbances`
- `UserPreferences` : ajout `timezone`, `theme`, `medicationReminderTime`, `last*SentDate`
- `PushSubscription` : stockage VAPID (endpoint + keys)
- `CaregiverRelationship` : `caregiverId` optionnel + `caregiverEmail` requis

---

## Notes

- Une migration Prisma est necessaire (UserPreferences + PushSubscription).
- Les pages marketing restent independantes du MVP produit.

*Derniere mise a jour : 2026-01-23*
