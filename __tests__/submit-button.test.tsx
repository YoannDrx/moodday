import { LoadingButton } from "@/features/form/submit-button";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("LoadingButton", () => {
  it("keeps a stable accessible name while loading", () => {
    const { rerender } = render(
      <LoadingButton loading={false}>Continuer</LoadingButton>,
    );

    expect(screen.getByRole("button", { name: "Continuer" })).toBeEnabled();

    rerender(<LoadingButton loading>Continuer</LoadingButton>);

    expect(screen.getByRole("button", { name: "Continuer" })).toBeDisabled();
  });

  it("preserves an explicit disabled state", () => {
    render(<LoadingButton disabled>Enregistrer</LoadingButton>);

    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
  });
});
