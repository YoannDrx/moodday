import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CrisisNumbersBar } from "@/components/crisis/crisis-numbers-bar";
import { crisisResources } from "@/lib/design-tokens";

describe("CrisisNumbersBar", () => {
  it.each([
    ["fr", "Numéros d’urgence"],
    ["en", "Emergency numbers"],
  ])("lists the four French emergency numbers (%s)", (locale, label) => {
    render(<CrisisNumbersBar locale={locale} />);

    const bar = screen.getByRole("complementary", { name: label });
    const hrefs = Array.from(bar.querySelectorAll("a")).map((link) =>
      link.getAttribute("href"),
    );
    expect(hrefs).toEqual([
      "tel:3114",
      "tel:15",
      "tel:112",
      "sms:114",
      "/crisis",
    ]);
  });

  it("keeps 112 and 114 on the full crisis resource page", () => {
    expect(crisisResources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ phone: "112", category: "emergency" }),
        expect.objectContaining({ sms: "114", category: "emergency" }),
      ]),
    );
  });
});
