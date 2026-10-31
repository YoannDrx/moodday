import { render } from "react-email";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { BETTER_AUTH_SECRET: "synthetic-test-secret-for-lifecycle-tokens-00" },
}));
vi.mock("@/lib/mail/send-email", () => ({ sendEmail: vi.fn() }));

import DuoFormedEmail from "@email/couple/duo-formed";
import OwnerInviteEmail from "@email/couple/owner-invite";
import OwnerRhythmEmail from "@email/couple/owner-rhythm";
import OwnerWelcomeEmail from "@email/couple/owner-welcome";
import SupporterDayTwoEmail from "@email/couple/supporter-day-two";
import SupporterGraduationEmail from "@email/couple/supporter-graduation";
import SupporterInviteEmail from "@email/couple/supporter-invite";
import SupporterWelcomeEmail from "@email/couple/supporter-welcome";
import WaitlistConfirmationEmail from "@email/couple/waitlist-confirmation";
import {
  pickLifecycleStep,
  type LifecycleInput,
} from "@/features/couple/lifecycle-plan";
import {
  createUnsubscribeToken,
  readUnsubscribeToken,
} from "@/features/couple/lifecycle.service";

const base: LifecycleInput = {
  role: "cycle_owner",
  daysSinceOnboarding: 0,
  hasActiveLink: false,
  daysSinceLinked: null,
  checkInCount: 0,
  completedLessons: 0,
  totalLessons: 7,
  sent: new Set(),
  localHour: 10,
};

describe("lifecycle sequence planning", () => {
  it("welcomes each side first, once", () => {
    expect(pickLifecycleStep(base)).toBe("owner_welcome");
    expect(pickLifecycleStep({ ...base, role: "supporter" })).toBe(
      "supporter_welcome",
    );
    expect(
      pickLifecycleStep({ ...base, sent: new Set(["owner_welcome"]) }),
    ).toBeNull();
  });

  it("nudges her to invite only while she has no duo", () => {
    const day2 = {
      ...base,
      daysSinceOnboarding: 2,
      sent: new Set(["owner_welcome"]),
    };
    expect(pickLifecycleStep(day2)).toBe("owner_invite");
    expect(
      pickLifecycleStep({ ...day2, hasActiveLink: true, daysSinceLinked: 30 }),
    ).toBeNull();
  });

  it("only reminds about the check-in when she rarely does it", () => {
    const day5 = {
      ...base,
      daysSinceOnboarding: 5,
      sent: new Set(["owner_welcome", "owner_invite"]),
    };
    expect(pickLifecycleStep(day5)).toBe("owner_rhythm");
    expect(pickLifecycleStep({ ...day5, checkInCount: 4 })).toBeNull();
  });

  it("celebrates a new duo before anything else", () => {
    expect(
      pickLifecycleStep({ ...base, hasActiveLink: true, daysSinceLinked: 0 }),
    ).toBe("duo_formed");
  });

  it("follows the partner through the Ally programme", () => {
    const supporter = {
      ...base,
      role: "supporter" as const,
      sent: new Set(["supporter_welcome"]),
    };
    expect(pickLifecycleStep({ ...supporter, daysSinceOnboarding: 1 })).toBe(
      "supporter_day_two",
    );
    expect(
      pickLifecycleStep({
        ...supporter,
        daysSinceOnboarding: 1,
        completedLessons: 3,
      }),
    ).toBeNull();
    expect(
      pickLifecycleStep({
        ...supporter,
        daysSinceOnboarding: 4,
        completedLessons: 3,
      }),
    ).toBe("supporter_invite");
    expect(
      pickLifecycleStep({
        ...supporter,
        daysSinceOnboarding: 9,
        completedLessons: 7,
      }),
    ).toBe("supporter_graduation");
  });

  it("never sends at night or outside the window", () => {
    expect(pickLifecycleStep({ ...base, localHour: 7 })).toBeNull();
    expect(pickLifecycleStep({ ...base, localHour: 21 })).toBeNull();
    expect(pickLifecycleStep({ ...base, daysSinceOnboarding: 60 })).toBeNull();
  });
});

describe("unsubscribe tokens", () => {
  it("round-trips a signed token and rejects tampering", () => {
    const token = createUnsubscribeToken("user-1");
    expect(readUnsubscribeToken(token)).toBe("user-1");
    expect(readUnsubscribeToken(token.replace("user-1", "user-2"))).toBeNull();
    expect(readUnsubscribeToken("garbage")).toBeNull();
  });
});

describe("email templates", () => {
  const unsubscribeUrl = "https://www.moodday.app/emails/unsubscribe?token=t";
  const templates = {
    ownerWelcome: OwnerWelcomeEmail({ userName: "Léa", unsubscribeUrl }),
    ownerInvite: OwnerInviteEmail({ userName: "Léa", unsubscribeUrl }),
    ownerRhythm: OwnerRhythmEmail({ userName: "Léa", unsubscribeUrl }),
    supporterWelcome: SupporterWelcomeEmail({
      userName: "Tom",
      lessonSlug: "jour-1-le-spm-sans-cliches",
      unsubscribeUrl,
    }),
    supporterDayTwo: SupporterDayTwoEmail({
      userName: "Tom",
      lessonSlug: "jour-2-ce-qui-se-passe-dans-son-corps",
      lessonTitle: "Ce qui se passe dans son corps",
      unsubscribeUrl,
    }),
    supporterInvite: SupporterInviteEmail({ userName: "Tom", unsubscribeUrl }),
    supporterGraduation: SupporterGraduationEmail({
      userName: "Tom",
      unsubscribeUrl,
    }),
    duoFormed: DuoFormedEmail({
      userName: "Léa",
      partnerName: "Tom",
      role: "cycle_owner",
      unsubscribeUrl,
    }),
  };

  it.each(Object.entries(templates))(
    "%s carries an opt-out link and no health data",
    async (_name, element) => {
      const html = await render(element);
      expect(html).toContain(unsubscribeUrl.replace(/&/gu, "&amp;"));
      // Only product guidance: no state, symptom or cycle date of anyone.
      // The state labels, as written in a check-in, never appear.
      expect(html).not.toMatch(
        /\b(Fragile|Difficile|Très dur|Crampes|Irritabilité)\b|J-\d/u,
      );
      expect(html).toContain("Moodday");
    },
  );

  it("keeps the waitlist confirmation free of any opt-out link", async () => {
    const html = await render(WaitlistConfirmationEmail());
    expect(html).toContain("place au chaud");
    expect(html).not.toContain("emails/unsubscribe");
  });
});
