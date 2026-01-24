# Story 3.8: Medication Reminders (Optional)

Status: partial

## Story

As a **user**,
I want **to configure reminders for my medications**,
so that **I don't forget to take them**.

## Acceptance Criteria

1. Option to enable reminders per medication
2. Configuration of reminder times
3. PWA push notification
4. Gentle reminders (no pressure)
5. Easy to disable

## Status Update (2026-01-23)

- ✅ PWA + Service Worker en place.
- ✅ Preferences notif + heure de rappel medicaments (UserPreferences).
- ✅ Push notifications serveur (VAPID) + endpoint d'inscription.
- ✅ Route cron pour envoi des rappels journaliers.
- ⚠️ Rappels par medicament et horaires multiples non encore implementes.
- ⚠️ Verification des prises en attente avant notification (optionnel) a ajouter.

## Status: Partiel (MVP)

La partie "rappel global" est fonctionnelle. Les rappels par medicament (FR18) restent a completer.

## Dev Notes

### Technical Requirements
- Web Push API (Service Worker + VAPID)
- Stockage des subscriptions en DB
- Cron job pour scheduling (Vercel Cron ou equivalent)

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.8]
