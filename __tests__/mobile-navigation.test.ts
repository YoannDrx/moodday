import { describe, expect, it } from "vitest";
import {
  needsOnboarding,
  routeForNotificationUrl,
  tabsForRole,
} from "../apps/mobile/src/lib/navigation";
import { crisisResources } from "../apps/mobile/src/lib/crisis";

describe("native navigation by role", () => {
  it("gives her Aujourd'hui, Cycle, Duo and Pour moi", () => {
    expect(
      tabsForRole("cycle_owner").map(({ name, title }) => [name, title]),
    ).toEqual([
      ["index", "Aujourd’hui"],
      ["cycle", "Cycle"],
      ["duo", "Duo"],
      ["ally", "Pour moi"],
    ]);
  });

  it("gives the partner the same four routes with partner wording", () => {
    expect(
      tabsForRole("supporter").map(({ name, title }) => [name, title]),
    ).toEqual([
      ["index", "Aujourd’hui"],
      ["cycle", "Son cycle"],
      ["duo", "Duo"],
      ["ally", "Allié"],
    ]);
  });

  it("falls back to her wording while the role is unknown", () => {
    expect(tabsForRole(null).map((tab) => tab.title)).toEqual(
      tabsForRole("cycle_owner").map((tab) => tab.title),
    );
  });

  it("opens Aujourd'hui for any notification except duo changes", () => {
    expect(routeForNotificationUrl("/today")).toBe("/");
    expect(routeForNotificationUrl("/duo")).toBe("/duo");
    expect(routeForNotificationUrl("https://evil.example/")).toBe("/");
    expect(routeForNotificationUrl(undefined)).toBe("/");
  });

  it("sends accounts without a role, or not onboarded, to the onboarding", () => {
    expect(needsOnboarding({ role: null, onboarded: false })).toBe(true);
    expect(needsOnboarding({ role: "supporter", onboarded: true })).toBe(false);
    expect(needsOnboarding({ role: "cycle_owner", onboarded: false })).toBe(
      true,
    );
  });
});

describe("native help numbers", () => {
  it("bundles 3114, 15, 112 and 114 as device links that need no network", () => {
    expect(crisisResources.map((resource) => resource.number)).toEqual([
      "3114",
      "15",
      "112",
      "114",
    ]);
    for (const resource of crisisResources) {
      expect(resource.href).toMatch(/^(tel|sms):\d+$/u);
    }
    expect(
      crisisResources.find((resource) => resource.number === "114")?.href,
    ).toBe("sms:114");
  });
});
