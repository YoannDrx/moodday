import { RegulatoryExportDownload } from "@app/regulatory-export/[requestReference]/download-client";
import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setup } from "../test/setup";

const REFERENCE = "A".repeat(43);
const TOKEN = "B".repeat(43);

describe("RegulatoryExportDownload", () => {
  beforeEach(() => {
    window.history.replaceState(
      null,
      "",
      `/regulatory-export/${REFERENCE}#token=${TOKEN}`,
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(new Blob(["encrypted-export"]), {
          status: 200,
          headers: { "Content-Type": "application/octet-stream" },
        }),
      ),
    );
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:regulatory-export"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      () => undefined,
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("removes the secret fragment before sending the token in a POST body", async () => {
    const { user } = setup(
      <RegulatoryExportDownload requestReference={REFERENCE} />,
    );

    await waitFor(() => expect(window.location.hash).toBe(""));
    expect(document.body.textContent).not.toContain(TOKEN);

    await user.click(
      screen.getByRole("button", {
        name: "Télécharger le fichier chiffré",
      }),
    );

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Téléchargement démarré",
      ),
    );
    expect(fetch).toHaveBeenCalledWith(
      `/api/regulatory-export/${REFERENCE}`,
      expect.objectContaining({
        method: "POST",
        credentials: "omit",
        body: JSON.stringify({ token: TOKEN }),
      }),
    );
    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).not.toContain(TOKEN);
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledOnce(), {
      timeout: 1_500,
    });
  });

  it("does not offer a download when the fragment has no token", async () => {
    window.history.replaceState(null, "", `/regulatory-export/${REFERENCE}`);

    setup(<RegulatoryExportDownload requestReference={REFERENCE} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid link");
    expect(fetch).not.toHaveBeenCalled();
  });
});
