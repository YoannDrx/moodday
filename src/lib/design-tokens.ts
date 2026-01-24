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

export const symptomLabels: Record<Symptom, { fr: string; en: string }> = {
  anxiety: { fr: "Anxiété", en: "Anxiety" },
  irritability: { fr: "Irritabilité", en: "Irritability" },
  ruminations: { fr: "Ruminations", en: "Ruminations" },
  agitation: { fr: "Agitation", en: "Agitation" },
  brain_fog: { fr: "Brouillard mental", en: "Brain fog" },
  tension: { fr: "Tension", en: "Tension" },
  sadness: { fr: "Tristesse", en: "Sadness" },
  euphoria: { fr: "Euphorie", en: "Euphoria" },
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

export const eventOptionLabels: Record<
  EventOption,
  { fr: string; en: string }
> = {
  work: { fr: "Travail", en: "Work" },
  family: { fr: "Famille", en: "Family" },
  sport: { fr: "Sport", en: "Sport" },
  alcohol: { fr: "Alcool", en: "Alcohol" },
  conflict: { fr: "Conflit", en: "Conflict" },
  social_outing: { fr: "Sortie sociale", en: "Social outing" },
  bad_news: { fr: "Mauvaise nouvelle", en: "Bad news" },
  success: { fr: "Succès", en: "Success" },
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

export const sleepDisturbanceLabels: Record<
  SleepDisturbance,
  { fr: string; en: string }
> = {
  nightmares: { fr: "Cauchemars", en: "Nightmares" },
  multiple_awakenings: { fr: "Réveils multiples", en: "Multiple awakenings" },
  initial_insomnia: { fr: "Insomnie initiale", en: "Initial insomnia" },
  agitation: { fr: "Agitation", en: "Agitation" },
  night_sweats: { fr: "Sueur nocturne", en: "Night sweats" },
  early_awakening: { fr: "Réveil précoce", en: "Early awakening" },
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

export const contextTagLabels: Record<ContextTag, { fr: string; en: string }> =
  {
    work: { fr: "Travail", en: "Work" },
    family: { fr: "Famille", en: "Family" },
    social: { fr: "Social", en: "Social" },
    health: { fr: "Santé", en: "Health" },
    sleep: { fr: "Sommeil", en: "Sleep" },
    exercise: { fr: "Sport", en: "Exercise" },
    medication: { fr: "Médicament", en: "Medication" },
    therapy: { fr: "Thérapie", en: "Therapy" },
    stress: { fr: "Stress", en: "Stress" },
    relaxation: { fr: "Détente", en: "Relaxation" },
    creative: { fr: "Créativité", en: "Creative" },
    nature: { fr: "Nature", en: "Nature" },
    travel: { fr: "Voyage", en: "Travel" },
    finance: { fr: "Finances", en: "Finance" },
    relationship: { fr: "Relation", en: "Relationship" },
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

export const sideEffectLabels: Record<SideEffect, { fr: string; en: string }> =
  {
    nausea: { fr: "Nausées", en: "Nausea" },
    headache: { fr: "Maux de tête", en: "Headache" },
    dizziness: { fr: "Vertiges", en: "Dizziness" },
    fatigue: { fr: "Fatigue", en: "Fatigue" },
    insomnia: { fr: "Insomnie", en: "Insomnia" },
    drowsiness: { fr: "Somnolence", en: "Drowsiness" },
    dry_mouth: { fr: "Bouche sèche", en: "Dry mouth" },
    appetite_change: { fr: "Changement d'appétit", en: "Appetite change" },
    weight_change: { fr: "Changement de poids", en: "Weight change" },
    tremor: { fr: "Tremblements", en: "Tremor" },
    anxiety: { fr: "Anxiété", en: "Anxiety" },
    restlessness: { fr: "Agitation", en: "Restlessness" },
    constipation: { fr: "Constipation", en: "Constipation" },
    blurred_vision: { fr: "Vision floue", en: "Blurred vision" },
    sweating: { fr: "Transpiration", en: "Sweating" },
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

export const sleepQualityLabels: Record<
  SleepQuality,
  { fr: string; en: string }
> = {
  bad: { fr: "Mauvais", en: "Bad" },
  average: { fr: "Moyen", en: "Average" },
  good: { fr: "Bon", en: "Good" },
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

export const moodObservedLabels: Record<
  MoodObserved,
  { fr: string; en: string }
> = {
  very_good: { fr: "Très bien", en: "Very good" },
  good: { fr: "Bien", en: "Good" },
  neutral: { fr: "Neutre", en: "Neutral" },
  down: { fr: "Bas", en: "Down" },
  very_down: { fr: "Très bas", en: "Very down" },
  concerning: { fr: "Préoccupant", en: "Concerning" },
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

export const energyObservedLabels: Record<
  EnergyObserved,
  { fr: string; en: string }
> = {
  high: { fr: "Élevée", en: "High" },
  normal: { fr: "Normale", en: "Normal" },
  low: { fr: "Basse", en: "Low" },
  very_low: { fr: "Très basse", en: "Very low" },
};

export const socialBehaviorOptions = [
  "engaged",
  "normal",
  "withdrawn",
  "isolated",
] as const;

export type SocialBehavior = (typeof socialBehaviorOptions)[number];

export const socialBehaviorLabels: Record<
  SocialBehavior,
  { fr: string; en: string }
> = {
  engaged: { fr: "Engagé", en: "Engaged" },
  normal: { fr: "Normal", en: "Normal" },
  withdrawn: { fr: "Renfermé", en: "Withdrawn" },
  isolated: { fr: "Isolé", en: "Isolated" },
};

export const sleepObservedOptions = [
  "good",
  "restless",
  "insomnia",
  "oversleeping",
] as const;

export type SleepObserved = (typeof sleepObservedOptions)[number];

export const sleepObservedLabels: Record<
  SleepObserved,
  { fr: string; en: string }
> = {
  good: { fr: "Bon", en: "Good" },
  restless: { fr: "Agité", en: "Restless" },
  insomnia: { fr: "Insomnie", en: "Insomnia" },
  oversleeping: { fr: "Hypersomnie", en: "Oversleeping" },
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

export const eventTypeLabels: Record<EventType, { fr: string; en: string }> = {
  compulsive_purchase: { fr: "Achat compulsif", en: "Compulsive purchase" },
  crisis: { fr: "Crise", en: "Crisis" },
  conflict: { fr: "Conflit", en: "Conflict" },
  milestone: { fr: "Étape importante", en: "Milestone" },
  medication_issue: { fr: "Problème médicament", en: "Medication issue" },
  other: { fr: "Autre", en: "Other" },
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
  name: string;
  description?: { fr: string; en: string };
  phone?: string;
  url?: string;
  sms?: string;
  available?: string;
  category: "hotline" | "chat" | "emergency" | "support";
};

export const crisisResources: CrisisResource[] = [
  {
    name: "3114 - Numéro national de prévention du suicide",
    description: {
      fr: "Ligne d'écoute gratuite et confidentielle pour toute personne en détresse psychologique ou inquiète pour un proche.",
      en: "Free and confidential helpline for anyone in psychological distress or worried about a loved one.",
    },
    phone: "3114",
    url: "https://3114.fr",
    available: "24/7",
    category: "hotline",
  },
  {
    name: "SOS Amitié",
    description: {
      fr: "Écoute anonyme et bienveillante pour les personnes en souffrance psychologique.",
      en: "Anonymous and caring support for people in psychological distress.",
    },
    phone: "09 72 39 40 50",
    url: "https://www.sos-amitie.com",
    available: "24/7",
    category: "hotline",
  },
  {
    name: "Fil Santé Jeunes",
    description: {
      fr: "Écoute, information et orientation pour les jeunes de 12 à 25 ans.",
      en: "Listening, information and guidance for young people aged 12-25.",
    },
    phone: "0 800 235 236",
    url: "https://www.filsantejeunes.com",
    available: "9h-23h",
    category: "support",
  },
  {
    name: "SAMU - Urgences médicales",
    description: {
      fr: "Service d'aide médicale urgente. En cas d'urgence vitale.",
      en: "Emergency medical service. For life-threatening emergencies.",
    },
    phone: "15",
    available: "24/7",
    category: "emergency",
  },
  {
    name: "Suicide Écoute",
    description: {
      fr: "Ligne d'écoute pour les personnes suicidaires et leurs proches.",
      en: "Helpline for suicidal individuals and their loved ones.",
    },
    phone: "01 45 39 40 00",
    available: "24/7",
    category: "hotline",
  },
  {
    name: "Argos 2001 - Bipolaires",
    description: {
      fr: "Association d'aide aux personnes atteintes de troubles bipolaires et leurs proches.",
      en: "Association helping people with bipolar disorder and their loved ones.",
    },
    phone: "01 46 28 01 03",
    url: "https://www.argos2001.fr",
    category: "support",
  },
];
