import {
  avoidHintsForNeeds,
  labelForNeed,
  labelForSymptom,
  stateCatalog,
  suggestGestures,
  type CheckInStateKey,
} from "./catalog";
import { phaseLabels, type CycleSnapshot } from "./cycle";

export type SharingLevelKey =
  | "cycle_only"
  | "cycle_state"
  | "cycle_state_needs";

export const sharingLevels: Record<
  SharingLevelKey,
  { label: string; description: string }
> = {
  cycle_only: {
    label: "Le cycle seulement",
    description: "Ta phase du cycle et la date approximative de tes règles.",
  },
  cycle_state: {
    label: "Cycle + mon point",
    description: "En plus : comment tu te sens aujourd'hui, quand tu le dis.",
  },
  cycle_state_needs: {
    label: "Cycle + point + besoins",
    description: "En plus : ce dont tu as besoin. C'est là que la magie opère.",
  },
};

export type PartnerViewInput = {
  level: SharingLevelKey;
  shareSymptoms: boolean;
  pausedUntil: Date | null;
  now: Date;
  ownerName: string;
  cycle: CycleSnapshot;
  checkIn: {
    id: string;
    state: CheckInStateKey;
    symptoms: readonly string[];
    needs: readonly string[];
    updatedAt: Date;
  } | null;
  customNeeds?: readonly { id: string; label: string }[];
};

export type PartnerView =
  | { status: "paused"; ownerName: string; pausedUntil: string }
  | {
      status: "active";
      ownerName: string;
      cycle: {
        phase: CycleSnapshot["phase"];
        phaseText: string;
        daysUntilNextPeriod: number | null;
        confidence: CycleSnapshot["confidence"];
      };
      today: {
        checkInId: string;
        state: CheckInStateKey;
        stateLabel: string;
        sharedAt: string;
        needs: { key: string; label: string }[];
        symptoms: string[];
        avoid: string[];
        suggestions: { key: string; label: string }[];
      } | null;
      // True when she checked in but her level hides the details.
      checkedInPrivately: boolean;
    };

/**
 * The only shape a partner ever receives. The private note is never an input
 * of this function, so it can never leak into the projection.
 */
export const projectPartnerView = (input: PartnerViewInput): PartnerView => {
  if (input.pausedUntil && input.pausedUntil.getTime() > input.now.getTime()) {
    return {
      status: "paused",
      ownerName: input.ownerName,
      pausedUntil: input.pausedUntil.toISOString(),
    };
  }

  const cycle = {
    phase: input.cycle.phase,
    phaseText: phaseLabels[input.cycle.phase].partner,
    daysUntilNextPeriod:
      input.cycle.phase === "unknown" ? null : input.cycle.daysUntilNextPeriod,
    confidence: input.cycle.confidence,
  };

  if (!input.checkIn || input.level === "cycle_only") {
    return {
      status: "active",
      ownerName: input.ownerName,
      cycle,
      today: null,
      checkedInPrivately: Boolean(input.checkIn),
    };
  }

  const shareNeeds = input.level === "cycle_state_needs";
  const needs = shareNeeds
    ? input.checkIn.needs.flatMap((key) => {
        const label = labelForNeed(key, input.customNeeds);
        return label ? [{ key, label }] : [];
      })
    : [];

  return {
    status: "active",
    ownerName: input.ownerName,
    cycle,
    today: {
      checkInId: input.checkIn.id,
      state: input.checkIn.state,
      stateLabel: stateCatalog[input.checkIn.state].label,
      sharedAt: input.checkIn.updatedAt.toISOString(),
      needs,
      symptoms: input.shareSymptoms
        ? input.checkIn.symptoms.flatMap((key) => labelForSymptom(key) ?? [])
        : [],
      avoid: shareNeeds ? avoidHintsForNeeds(input.checkIn.needs) : [],
      suggestions: suggestGestures(
        shareNeeds ? input.checkIn.needs : [],
        input.checkIn.state,
      ).map(({ key, label }) => ({ key, label })),
    },
    checkedInPrivately: false,
  };
};
