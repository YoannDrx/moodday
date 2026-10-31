// Onboarding email sequence. Pure planning logic: which single step (if any)
// a person should receive now. Health data is never an input of an email, only
// of the decision to send a product tip.

export type LifecycleStep =
  | "owner_welcome"
  | "owner_invite"
  | "owner_rhythm"
  | "supporter_welcome"
  | "supporter_day_two"
  | "supporter_invite"
  | "supporter_graduation"
  | "duo_formed";

export type LifecycleInput = {
  role: "cycle_owner" | "supporter";
  /** Days since the onboarding was completed. */
  daysSinceOnboarding: number;
  hasActiveLink: boolean;
  /** Days since the current link became active, if any. */
  daysSinceLinked: number | null;
  checkInCount: number;
  completedLessons: number;
  totalLessons: number;
  sent: ReadonlySet<string>;
  /** Local hour of the recipient, 0..23. */
  localHour: number;
};

type Rule = {
  step: LifecycleStep;
  role: LifecycleInput["role"] | "both";
  due: (input: LifecycleInput) => boolean;
};

/** Order matters: the first due step wins, one email per run at most. */
export const lifecycleRules: Rule[] = [
  {
    step: "duo_formed",
    role: "both",
    due: (input) =>
      input.hasActiveLink &&
      input.daysSinceLinked !== null &&
      input.daysSinceLinked <= 7,
  },
  {
    step: "owner_welcome",
    role: "cycle_owner",
    due: (input) => input.daysSinceOnboarding <= 3,
  },
  {
    step: "owner_invite",
    role: "cycle_owner",
    due: (input) =>
      !input.hasActiveLink &&
      input.daysSinceOnboarding >= 2 &&
      input.daysSinceOnboarding <= 10,
  },
  {
    step: "owner_rhythm",
    role: "cycle_owner",
    due: (input) =>
      input.checkInCount < 3 &&
      input.daysSinceOnboarding >= 5 &&
      input.daysSinceOnboarding <= 14,
  },
  {
    step: "supporter_welcome",
    role: "supporter",
    due: (input) => input.daysSinceOnboarding <= 3,
  },
  {
    step: "supporter_graduation",
    role: "supporter",
    due: (input) =>
      input.completedLessons >= input.totalLessons &&
      input.daysSinceOnboarding <= 45,
  },
  {
    step: "supporter_day_two",
    role: "supporter",
    due: (input) =>
      input.completedLessons < 2 &&
      input.daysSinceOnboarding >= 1 &&
      input.daysSinceOnboarding <= 7,
  },
  {
    step: "supporter_invite",
    role: "supporter",
    due: (input) =>
      !input.hasActiveLink &&
      input.daysSinceOnboarding >= 3 &&
      input.daysSinceOnboarding <= 14,
  },
];

export const SEND_WINDOW = { startHour: 9, endHour: 20 } as const;

export const pickLifecycleStep = (
  input: LifecycleInput,
): LifecycleStep | null => {
  if (
    input.localHour < SEND_WINDOW.startHour ||
    input.localHour >= SEND_WINDOW.endHour
  ) {
    return null;
  }
  for (const rule of lifecycleRules) {
    if (rule.role !== "both" && rule.role !== input.role) continue;
    if (input.sent.has(rule.step)) continue;
    if (rule.due(input)) return rule.step;
  }
  return null;
};
