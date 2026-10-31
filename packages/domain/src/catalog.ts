// Built-in vocabularies. Keys are stored in the database; labels are shown in
// the product. Keep keys stable: renaming a key orphans existing check-ins.

export const checkInStates = ["ok", "fragile", "hard", "very_hard"] as const;
export type CheckInStateKey = (typeof checkInStates)[number];

export type CatalogEntry = { key: string; label: string; hint?: string };

export const stateCatalog: Record<
  CheckInStateKey,
  { label: string; hint: string; partnerLabel: string; weight: number }
> = {
  ok: {
    label: "Ça va",
    hint: "Rien à signaler, ou presque.",
    partnerLabel: "ça va",
    weight: 0,
  },
  fragile: {
    label: "Fragile",
    hint: "À manipuler avec douceur.",
    partnerLabel: "fragile",
    weight: 1,
  },
  hard: {
    label: "Difficile",
    hint: "Journée en pente.",
    partnerLabel: "difficile",
    weight: 2,
  },
  very_hard: {
    label: "Très dur",
    hint: "Aujourd'hui, c'est lourd.",
    partnerLabel: "très dur",
    weight: 3,
  },
};

export const isDifficultState = (state: CheckInStateKey) =>
  stateCatalog[state].weight >= 1;

export const symptomCatalog = [
  { key: "cramps", label: "Crampes", group: "body" },
  { key: "bloating", label: "Ventre gonflé", group: "body" },
  { key: "breast_tenderness", label: "Poitrine sensible", group: "body" },
  { key: "headache", label: "Maux de tête", group: "body" },
  { key: "fatigue", label: "Fatigue", group: "body" },
  { key: "sleep", label: "Sommeil en vrac", group: "body" },
  { key: "cravings", label: "Fringales", group: "body" },
  { key: "skin", label: "Peau capricieuse", group: "body" },
  { key: "irritability", label: "Irritabilité", group: "mind" },
  { key: "tears", label: "Larmes faciles", group: "mind" },
  { key: "anxiety", label: "Anxiété", group: "mind" },
  { key: "low_mood", label: "Moral en berne", group: "mind" },
  { key: "sensitivity", label: "Hypersensibilité", group: "mind" },
  { key: "focus", label: "Tête dans le brouillard", group: "mind" },
] as const satisfies readonly (CatalogEntry & { group: "body" | "mind" })[];
export type SymptomKey = (typeof symptomCatalog)[number]["key"];

export const needCatalog = [
  { key: "calm", label: "Du calme" },
  { key: "hug", label: "Un câlin" },
  { key: "space", label: "De l'espace" },
  { key: "listen", label: "Qu'on m'écoute, sans conseils" },
  { key: "dinner", label: "Qu'on gère le dîner" },
  { key: "chores", label: "Un coup de main à la maison" },
  { key: "outing", label: "Une sortie légère" },
  { key: "no_heavy_topics", label: "Pas de sujets lourds" },
  { key: "hot_water_bottle", label: "Une bouillotte" },
  { key: "sweet", label: "Du sucré, vite" },
  { key: "sleep", label: "Dormir tôt" },
  { key: "company", label: "De la présence, tout simplement" },
] as const satisfies readonly CatalogEntry[];
export type BuiltInNeedKey = (typeof needCatalog)[number]["key"];

export const customNeedKey = (id: string) => `custom:${id}`;
export const isCustomNeedKey = (key: string) => key.startsWith("custom:");

export const gestureCatalog = [
  { key: "dinner", label: "Je m'occupe du dîner", answers: ["dinner"] },
  { key: "chores", label: "Je gère la maison ce soir", answers: ["chores"] },
  {
    key: "quiet_evening",
    label: "Je te laisse ta soirée tranquille",
    answers: ["calm", "space"],
  },
  { key: "hug", label: "Câlin disponible sur demande", answers: ["hug"] },
  {
    key: "hot_water_bottle",
    label: "Bouillotte en préparation",
    answers: ["hot_water_bottle"],
  },
  { key: "sweet", label: "Chocolat en approche", answers: ["sweet"] },
  { key: "listen", label: "Je t'écoute, sans conseils", answers: ["listen"] },
  {
    key: "outing",
    label: "Petite balade quand tu veux ?",
    answers: ["outing"],
  },
  {
    key: "no_heavy_topics",
    label: "Sujets lourds : en pause",
    answers: ["no_heavy_topics"],
  },
  { key: "sleep", label: "Je gère, va te coucher", answers: ["sleep"] },
  { key: "here", label: "Je suis là", answers: ["company"] },
  { key: "thinking_of_you", label: "Je pense à toi", answers: [] },
] as const satisfies readonly (CatalogEntry & { answers: readonly string[] })[];
export type GestureKey = (typeof gestureCatalog)[number]["key"] | "custom";

export const findGesture = (key: string) =>
  gestureCatalog.find((gesture) => gesture.key === key);

export const labelForSymptom = (key: string) =>
  symptomCatalog.find((symptom) => symptom.key === key)?.label ?? null;

export const labelForNeed = (
  key: string,
  customNeeds: readonly { id: string; label: string }[] = [],
) => {
  if (isCustomNeedKey(key)) {
    const id = key.slice("custom:".length);
    return customNeeds.find((need) => need.id === id)?.label ?? null;
  }
  return needCatalog.find((need) => need.key === key)?.label ?? null;
};

/** What the partner should avoid today, derived only from explicit needs. */
export const avoidHintsForNeeds = (needs: readonly string[]) => {
  const hints: string[] = [];
  if (needs.includes("no_heavy_topics"))
    hints.push("Les sujets qui fâchent (budget, belle-famille, vaisselle).");
  if (needs.includes("listen"))
    hints.push("Les solutions qu'on n'a pas demandées.");
  if (needs.includes("space"))
    hints.push("Les « ça va ? » toutes les dix minutes.");
  if (needs.includes("calm")) hints.push("Les plans surprise et le bruit.");
  return hints;
};

/**
 * Two or three gestures suggested to the partner, drawn from her needs first,
 * then from her state. Never from the calendar.
 */
export const suggestGestures = (
  needs: readonly string[],
  state: CheckInStateKey | null,
  limit = 3,
) => {
  const picked: (typeof gestureCatalog)[number][] = [];
  for (const need of needs) {
    const match = gestureCatalog.find((gesture) =>
      (gesture.answers as readonly string[]).includes(need),
    );
    if (match && !picked.includes(match)) picked.push(match);
  }

  const fallbacks: GestureKey[] =
    state === "ok"
      ? ["thinking_of_you", "outing", "dinner"]
      : ["here", "dinner", "quiet_evening", "hot_water_bottle"];
  for (const key of fallbacks) {
    if (picked.length >= limit) break;
    const gesture = findGesture(key);
    if (gesture && !picked.includes(gesture)) picked.push(gesture);
  }

  return picked.slice(0, limit);
};
