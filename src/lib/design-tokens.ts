/**
 * Design Tokens for Moodday
 *
 * Centralized configuration for UI elements like mood colors,
 * context tags, side effects, sleep quality, etc.
 *
 * Based on the Moodday Design System:
 * - Soothing & Organic aesthetic
 * - Soft modernism with high border radii
 * - Teal/Ocean primary, Sage secondary, Lavender accents
 */

// ═══════════════════════════════════════════════════════════════
// MOODDAY BRAND COLORS
// ═══════════════════════════════════════════════════════════════

export const colors = {
  // Primary (Teal/Ocean) - Brand identity
  primary: {
    DEFAULT: "#2BA09F",
    dark: "#2A8FA8",
    light: "#3DA5B8",
    darkest: "#1D7680",
  },

  // Secondary (Sage/Nature) - Growth elements
  sage: {
    DEFAULT: "#48A878",
    dark: "#3A956E",
    light: "#6FBD94",
  },

  // Accent (Lavender) - Soft highlights
  lavender: {
    DEFAULT: "#D4C5E8",
    dark: "#B8A5D6",
  },

  // Warm Backgrounds - Canvas colors
  warm: {
    bg: "#F8F7F3",
    panel: "#F4F1ED",
  },

  // Emergency
  danger: "#EF4444",
} as const;

// ═══════════════════════════════════════════════════════════════
// MOODDAY SPACING & LAYOUT
// ═══════════════════════════════════════════════════════════════

export const borderRadius = {
  xl: "12px",
  "2xl": "24px",
  "3xl": "32px",
} as const;

export const shadows = {
  soft: "0 10px 25px -5px rgba(43, 160, 159, 0.1), 0 8px 10px -6px rgba(43, 160, 159, 0.05)",
  glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
  innerSoft: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)",
} as const;

// ═══════════════════════════════════════════════════════════════
// MOODDAY SYMPTOM OPTIONS (for Journal)
// ═══════════════════════════════════════════════════════════════

export const symptomOptions = [
  "anxiety",
  "irritability",
  "ruminations",
  "agitation",
  "brain_fog",
  "tension",
  "sadness",
  "euphoria",
] as const;

export type Symptom = (typeof symptomOptions)[number];

export const symptomLabels: Record<Symptom, string> = {
  anxiety: "labels.symptoms.anxiety",
  irritability: "labels.symptoms.irritability",
  ruminations: "labels.symptoms.ruminations",
  agitation: "labels.symptoms.agitation",
  brain_fog: "labels.symptoms.brain_fog",
  tension: "labels.symptoms.tension",
  sadness: "labels.symptoms.sadness",
  euphoria: "labels.symptoms.euphoria",
};

// ═══════════════════════════════════════════════════════════════
// MOODDAY EVENT OPTIONS (for Journal)
// ═══════════════════════════════════════════════════════════════

export const eventOptions = [
  "work",
  "family",
  "sport",
  "alcohol",
  "conflict",
  "social_outing",
  "bad_news",
  "success",
] as const;

export type EventOption = (typeof eventOptions)[number];

export const eventOptionLabels: Record<EventOption, string> = {
  work: "labels.events.work",
  family: "labels.events.family",
  sport: "labels.events.sport",
  alcohol: "labels.events.alcohol",
  conflict: "labels.events.conflict",
  social_outing: "labels.events.social_outing",
  bad_news: "labels.events.bad_news",
  success: "labels.events.success",
};

// ═══════════════════════════════════════════════════════════════
// MOODDAY SLEEP DISTURBANCES (for Journal)
// ═══════════════════════════════════════════════════════════════

export const sleepDisturbances = [
  "nightmares",
  "multiple_awakenings",
  "initial_insomnia",
  "agitation",
  "night_sweats",
  "early_awakening",
] as const;

export type SleepDisturbance = (typeof sleepDisturbances)[number];

export const sleepDisturbanceLabels: Record<SleepDisturbance, string> = {
  nightmares: "labels.sleepDisturbances.nightmares",
  multiple_awakenings: "labels.sleepDisturbances.multiple_awakenings",
  initial_insomnia: "labels.sleepDisturbances.initial_insomnia",
  agitation: "labels.sleepDisturbances.agitation",
  night_sweats: "labels.sleepDisturbances.night_sweats",
  early_awakening: "labels.sleepDisturbances.early_awakening",
};

// ═══════════════════════════════════════════════════════════════
// MOOD COLORS (0-10 scale)
// ═══════════════════════════════════════════════════════════════

export const moodColors: Record<number, string> = {
  0: "#dc2626", // red-600
  1: "#ef4444", // red-500
  2: "#f97316", // orange-500
  3: "#fb923c", // orange-400
  4: "#fbbf24", // amber-400
  5: "#facc15", // yellow-400
  6: "#a3e635", // lime-400
  7: "#84cc16", // lime-500
  8: "#22c55e", // green-500
  9: "#16a34a", // green-600
  10: "#15803d", // green-700
};

export const moodEmojis: Record<number, string> = {
  0: "😢",
  1: "😢",
  2: "😔",
  3: "😔",
  4: "😕",
  5: "😐",
  6: "🙂",
  7: "🙂",
  8: "😊",
  9: "😄",
  10: "😄",
};

export function getMoodColor(value: number): string {
  const clampedValue = Math.max(0, Math.min(10, Math.round(value)));
  return moodColors[clampedValue];
}

export function getMoodEmoji(value: number): string {
  const clampedValue = Math.max(0, Math.min(10, Math.round(value)));
  return moodEmojis[clampedValue];
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT TAGS
// ═══════════════════════════════════════════════════════════════

export const contextTags = [
  "work",
  "family",
  "social",
  "health",
  "sleep",
  "exercise",
  "medication",
  "therapy",
  "stress",
  "relaxation",
  "creative",
  "nature",
  "travel",
  "finance",
  "relationship",
] as const;

export type ContextTag = (typeof contextTags)[number];

export const contextTagLabels: Record<ContextTag, string> = {
  work: "labels.contextTags.work",
  family: "labels.contextTags.family",
  social: "labels.contextTags.social",
  health: "labels.contextTags.health",
  sleep: "labels.contextTags.sleep",
  exercise: "labels.contextTags.exercise",
  medication: "labels.contextTags.medication",
  therapy: "labels.contextTags.therapy",
  stress: "labels.contextTags.stress",
  relaxation: "labels.contextTags.relaxation",
  creative: "labels.contextTags.creative",
  nature: "labels.contextTags.nature",
  travel: "labels.contextTags.travel",
  finance: "labels.contextTags.finance",
  relationship: "labels.contextTags.relationship",
};

export const contextTagColors: Record<ContextTag, string> = {
  work: "#3b82f6", // blue-500
  family: "#ec4899", // pink-500
  social: "#8b5cf6", // violet-500
  health: "#10b981", // emerald-500
  sleep: "#6366f1", // indigo-500
  exercise: "#f97316", // orange-500
  medication: "#14b8a6", // teal-500
  therapy: "#06b6d4", // cyan-500
  stress: "#ef4444", // red-500
  relaxation: "#22c55e", // green-500
  creative: "#a855f7", // purple-500
  nature: "#84cc16", // lime-500
  travel: "#eab308", // yellow-500
  finance: "#64748b", // slate-500
  relationship: "#f43f5e", // rose-500
};

// ═══════════════════════════════════════════════════════════════
// SIDE EFFECTS
// ═══════════════════════════════════════════════════════════════

export const sideEffects = [
  "nausea",
  "headache",
  "dizziness",
  "fatigue",
  "insomnia",
  "drowsiness",
  "dry_mouth",
  "appetite_change",
  "weight_change",
  "tremor",
  "anxiety",
  "restlessness",
  "constipation",
  "blurred_vision",
  "sweating",
] as const;

export type SideEffect = (typeof sideEffects)[number];

export const sideEffectLabels: Record<SideEffect, string> = {
  nausea: "labels.sideEffects.nausea",
  headache: "labels.sideEffects.headache",
  dizziness: "labels.sideEffects.dizziness",
  fatigue: "labels.sideEffects.fatigue",
  insomnia: "labels.sideEffects.insomnia",
  drowsiness: "labels.sideEffects.drowsiness",
  dry_mouth: "labels.sideEffects.dry_mouth",
  appetite_change: "labels.sideEffects.appetite_change",
  weight_change: "labels.sideEffects.weight_change",
  tremor: "labels.sideEffects.tremor",
  anxiety: "labels.sideEffects.anxiety",
  restlessness: "labels.sideEffects.restlessness",
  constipation: "labels.sideEffects.constipation",
  blurred_vision: "labels.sideEffects.blurred_vision",
  sweating: "labels.sideEffects.sweating",
};

export const sideEffectColors: Record<SideEffect, string> = {
  nausea: "#fbbf24", // amber-400
  headache: "#ef4444", // red-500
  dizziness: "#a855f7", // purple-500
  fatigue: "#64748b", // slate-500
  insomnia: "#6366f1", // indigo-500
  drowsiness: "#3b82f6", // blue-500
  dry_mouth: "#f97316", // orange-500
  appetite_change: "#ec4899", // pink-500
  weight_change: "#14b8a6", // teal-500
  tremor: "#f43f5e", // rose-500
  anxiety: "#dc2626", // red-600
  restlessness: "#eab308", // yellow-500
  constipation: "#78716c", // stone-500
  blurred_vision: "#8b5cf6", // violet-500
  sweating: "#06b6d4", // cyan-500
};

// ═══════════════════════════════════════════════════════════════
// SLEEP QUALITY
// ═══════════════════════════════════════════════════════════════

export const sleepQualityOptions = ["bad", "average", "good"] as const;

export type SleepQuality = (typeof sleepQualityOptions)[number];

export const sleepQualityLabels: Record<SleepQuality, string> = {
  bad: "labels.sleepQuality.bad",
  average: "labels.sleepQuality.average",
  good: "labels.sleepQuality.good",
};

export const sleepQualityColors: Record<SleepQuality, string> = {
  bad: "#ef4444", // red-500
  average: "#fbbf24", // amber-400
  good: "#22c55e", // green-500
};

export const sleepQualityEmojis: Record<SleepQuality, string> = {
  bad: "😴",
  average: "😐",
  good: "😊",
};

// ═══════════════════════════════════════════════════════════════
// CAREGIVER OBSERVATION OPTIONS
// ═══════════════════════════════════════════════════════════════

export const moodObservedOptions = [
  "very_good",
  "good",
  "neutral",
  "down",
  "very_down",
  "concerning",
] as const;

export type MoodObserved = (typeof moodObservedOptions)[number];

export const moodObservedLabels: Record<MoodObserved, string> = {
  very_good: "labels.caregiver.moodObserved.very_good",
  good: "labels.caregiver.moodObserved.good",
  neutral: "labels.caregiver.moodObserved.neutral",
  down: "labels.caregiver.moodObserved.down",
  very_down: "labels.caregiver.moodObserved.very_down",
  concerning: "labels.caregiver.moodObserved.concerning",
};

export const moodObservedColors: Record<MoodObserved, string> = {
  very_good: "#15803d", // green-700
  good: "#22c55e", // green-500
  neutral: "#fbbf24", // amber-400
  down: "#f97316", // orange-500
  very_down: "#ef4444", // red-500
  concerning: "#dc2626", // red-600
};

export const energyObservedOptions = [
  "high",
  "normal",
  "low",
  "very_low",
] as const;

export type EnergyObserved = (typeof energyObservedOptions)[number];

export const energyObservedLabels: Record<EnergyObserved, string> = {
  high: "labels.caregiver.energyObserved.high",
  normal: "labels.caregiver.energyObserved.normal",
  low: "labels.caregiver.energyObserved.low",
  very_low: "labels.caregiver.energyObserved.very_low",
};

export const socialBehaviorOptions = [
  "engaged",
  "normal",
  "withdrawn",
  "isolated",
] as const;

export type SocialBehavior = (typeof socialBehaviorOptions)[number];

export const socialBehaviorLabels: Record<SocialBehavior, string> = {
  engaged: "labels.caregiver.socialBehavior.engaged",
  normal: "labels.caregiver.socialBehavior.normal",
  withdrawn: "labels.caregiver.socialBehavior.withdrawn",
  isolated: "labels.caregiver.socialBehavior.isolated",
};

export const sleepObservedOptions = [
  "good",
  "restless",
  "insomnia",
  "oversleeping",
] as const;

export type SleepObserved = (typeof sleepObservedOptions)[number];

export const sleepObservedLabels: Record<SleepObserved, string> = {
  good: "labels.caregiver.sleepObserved.good",
  restless: "labels.caregiver.sleepObserved.restless",
  insomnia: "labels.caregiver.sleepObserved.insomnia",
  oversleeping: "labels.caregiver.sleepObserved.oversleeping",
};

// ═══════════════════════════════════════════════════════════════
// CAREGIVER EVENT TYPES
// ═══════════════════════════════════════════════════════════════

export const eventTypes = [
  "compulsive_purchase",
  "crisis",
  "conflict",
  "milestone",
  "medication_issue",
  "other",
] as const;

export type EventType = (typeof eventTypes)[number];

export const eventTypeLabels: Record<EventType, string> = {
  compulsive_purchase: "labels.caregiver.eventTypes.compulsive_purchase",
  crisis: "labels.caregiver.eventTypes.crisis",
  conflict: "labels.caregiver.eventTypes.conflict",
  milestone: "labels.caregiver.eventTypes.milestone",
  medication_issue: "labels.caregiver.eventTypes.medication_issue",
  other: "labels.caregiver.eventTypes.other",
};

export const eventTypeColors: Record<EventType, string> = {
  compulsive_purchase: "#f97316", // orange-500
  crisis: "#dc2626", // red-600
  conflict: "#ef4444", // red-500
  milestone: "#22c55e", // green-500
  medication_issue: "#8b5cf6", // violet-500
  other: "#64748b", // slate-500
};

// ═══════════════════════════════════════════════════════════════
// CRISIS RESOURCES (France)
// ═══════════════════════════════════════════════════════════════

export type CrisisResource = {
  nameKey: string;
  descriptionKey?: string;
  availabilityKey?: string;
  phone?: string;
  url?: string;
  sms?: string;
  category: "hotline" | "chat" | "emergency" | "support";
};

export const crisisResources: CrisisResource[] = [
  {
    nameKey: "crisis.resources.3114.name",
    descriptionKey: "crisis.resources.3114.description",
    availabilityKey: "crisis.resources.3114.availability",
    phone: "3114",
    url: "https://3114.fr",
    category: "hotline",
  },
  {
    nameKey: "crisis.resources.sosAmitie.name",
    descriptionKey: "crisis.resources.sosAmitie.description",
    availabilityKey: "crisis.resources.sosAmitie.availability",
    phone: "09 72 39 40 50",
    url: "https://www.sos-amitie.com",
    category: "hotline",
  },
  {
    nameKey: "crisis.resources.filSanteJeunes.name",
    descriptionKey: "crisis.resources.filSanteJeunes.description",
    availabilityKey: "crisis.resources.filSanteJeunes.availability",
    phone: "0 800 235 236",
    url: "https://www.filsantejeunes.com",
    category: "support",
  },
  {
    nameKey: "crisis.resources.samu.name",
    descriptionKey: "crisis.resources.samu.description",
    availabilityKey: "crisis.resources.samu.availability",
    phone: "15",
    category: "emergency",
  },
  {
    nameKey: "crisis.resources.suicideEcoute.name",
    descriptionKey: "crisis.resources.suicideEcoute.description",
    availabilityKey: "crisis.resources.suicideEcoute.availability",
    phone: "01 45 39 40 00",
    category: "hotline",
  },
  {
    nameKey: "crisis.resources.argos.name",
    descriptionKey: "crisis.resources.argos.description",
    phone: "01 46 28 01 03",
    url: "https://www.argos2001.fr",
    category: "support",
  },
];
