import type {
  CheckInState,
  MooddayRole,
  SharingLevel,
  TodayDto,
} from "@moodday/contracts";
import {
  allyLessons,
  labelForNeed,
  stateCatalog,
  type CyclePhase,
} from "@moodday/domain";

// Pure presentation helpers shared by the native screens.

export const MAX_NEEDS = 2;
export const MAX_SYMPTOMS = 6;

export const toggleWithLimit = (
  list: readonly string[],
  key: string,
  limit: number,
) =>
  list.includes(key)
    ? list.filter((item) => item !== key)
    : list.length >= limit
      ? [...list]
      : [...list, key];

export const greeting = (name: string, hour: number) =>
  hour < 5
    ? `Encore debout, ${name} ?`
    : hour < 18
      ? `Bonjour ${name}`
      : `Bonsoir ${name}`;

const plural = (count: number, word: string) =>
  `${count} ${word}${Math.abs(count) > 1 ? "s" : ""}`;

export const cycleLine = (cycle: {
  cycleDay: number | null;
  daysUntilNextPeriod: number | null;
  periodOngoing: boolean;
  phase: string;
}) => {
  if (cycle.cycleDay === null)
    return "Note tes prochaines règles pour que Moodday apprenne ton rythme.";
  if (cycle.periodOngoing) return `Jour ${cycle.cycleDay} · règles en cours`;
  if (cycle.phase === "late")
    return `Jour ${cycle.cycleDay} · règles attendues`;
  return `Jour ${cycle.cycleDay} · règles prévues dans ~${plural(cycle.daysUntilNextPeriod ?? 0, "jour")}`;
};

/**
 * What her partner will see once she saves, worded from her sharing level.
 * The private note is never part of the preview, nor of the projection.
 */
export const partnerPreview = ({
  partnerName,
  level,
  paused,
  state,
  needs,
  customNeeds = [],
}: {
  partnerName: string | null;
  level: SharingLevel | null;
  paused: boolean;
  state: CheckInState | null;
  needs: readonly string[];
  customNeeds?: readonly { id: string; label: string }[];
}) => {
  if (!partnerName || !level) return null;
  if (paused)
    return `Partage en pause : ${partnerName} ne verra rien pour l’instant.`;
  if (level === "cycle_only")
    return `Avec ton niveau de partage, ${partnerName} voit seulement ton cycle.`;
  const stateText = state
    ? `« ${stateCatalog[state].partnerLabel} »`
    : "ton état du jour";
  if (level === "cycle_state")
    return `${partnerName} verra : ${stateText}. Tes besoins restent pour toi.`;
  const needLabels = needs
    .map((key) => labelForNeed(key, customNeeds)?.toLowerCase())
    .filter((label): label is string => Boolean(label));
  return needLabels.length > 0
    ? `${partnerName} verra : ${stateText} et « ${needLabels.join(" », « ")} ».`
    : `${partnerName} verra : ${stateText}.`;
};

export const sharingPreview = (level: SharingLevel, shareSymptoms: boolean) => {
  const lines = ["Ta phase du cycle et la date approximative de tes règles"];
  if (level !== "cycle_only")
    lines.push("Ton état du jour, quand tu fais ton point");
  if (level === "cycle_state_needs")
    lines.push("Tes besoins du jour et des idées de gestes");
  if (shareSymptoms && level !== "cycle_only") lines.push("Tes symptômes");
  return lines;
};

export const inviteMessage = (role: MooddayRole, code: string) =>
  role === "cycle_owner"
    ? `J’utilise Moodday pour mieux vivre mon SPM, à deux. Rejoins-moi avec ce code : ${code}`
    : `J’ai commencé un programme pour mieux comprendre ton cycle. On essaie ensemble ? Crée ton espace sur Moodday et entre ce code : ${code}`;

export const formatInviteCode = (code: string) => {
  const clean = code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return clean.length === 8 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
};

export const normalizeInviteInput = (value: string) => {
  const clean = value
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 8);
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
};

export const isCompleteInviteCode = (value: string) =>
  /^[A-Z0-9]{4}-?[A-Z0-9]{4}$/u.test(value.trim().toUpperCase());

type GuidedPhase = Exclude<CyclePhase, "unknown">;

export const phaseGuide: Record<
  GuidedPhase,
  { title: string; her: string; you: string }
> = {
  period: {
    title: "Pendant les règles",
    her: "Fatigue, crampes, besoin de chaleur. Pour beaucoup, l’humeur remonte au fil des jours.",
    you: "Bouillotte, repas simple, moins de charge mentale. Et pas de blague sur les règles.",
  },
  between: {
    title: "L’entre-deux",
    her: "Souvent la période la plus légère du cycle. L’énergie revient.",
    you: "Le bon moment pour les projets, les sorties, et parler de ce qui a aidé la dernière fois.",
  },
  before: {
    title: "Avant les règles",
    her: "Irritabilité, fatigue, sensibilité possibles. Ce n’est ni un caprice, ni « dans sa tête ».",
    you: "Moins de sujets lourds, plus de petites attentions. Suis ses besoins du jour, pas le calendrier.",
  },
  late: {
    title: "Règles attendues",
    her: "Le cycle varie d’un mois à l’autre. Un retard de quelques jours est fréquent.",
    you: "Pas de questions insistantes. Elle t’en parlera si elle en a envie.",
  },
};

export const guidedPhases = Object.keys(phaseGuide) as GuidedPhase[];

/**
 * The API gives the completed count and the next lesson (the first one not
 * done). Lessons before the next one are shown as done.
 */
export const allyProgress = (
  supporter: Pick<
    NonNullable<TodayDto["supporter"]>,
    "nextLesson" | "completedLessons"
  >,
) => {
  const nextIndex = supporter.nextLesson
    ? allyLessons.findIndex(
        (lesson) => lesson.slug === supporter.nextLesson?.slug,
      )
    : -1;
  return {
    done: supporter.nextLesson
      ? Math.min(Math.max(supporter.completedLessons, 0), allyLessons.length)
      : allyLessons.length,
    total: allyLessons.length,
    nextSlug: supporter.nextLesson?.slug ?? null,
    isCompleted: (slug: string) => {
      if (!supporter.nextLesson) return true;
      const index = allyLessons.findIndex((lesson) => lesson.slug === slug);
      return index >= 0 && index < nextIndex;
    },
  };
};

const civilFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const shortCivilFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export const formatCivilDate = (date: string, short = false) =>
  (short ? shortCivilFormatter : civilFormatter).format(
    new Date(`${date}T00:00:00Z`),
  );

export const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

export const formatGestureTime = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

export const formatPausedUntil = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

export const deviceTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris";
  } catch {
    return "Europe/Paris";
  }
};
