import { getEffectivePushContentMode } from "@/features/pwa/push-privacy";
import { describe, expect, it } from "vitest";

describe("push notification privacy", () => {
  it.each([
    [{ contentMode: "generic", trustedDevice: false }, "generic"],
    [{ contentMode: "generic", trustedDevice: true }, "generic"],
    [{ contentMode: "detailed", trustedDevice: false }, "generic"],
    [{ contentMode: "detailed", trustedDevice: true }, "detailed"],
  ] as const)("resolves %o to %s", (input, expected) => {
    expect(getEffectivePushContentMode(input)).toBe(expected);
  });
});
