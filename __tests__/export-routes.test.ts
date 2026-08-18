import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getRequiredUser: vi.fn(),
  buildUserDataExport: vi.fn(),
  createJsonDownloadStream: vi.fn(),
  enforceRateLimit: vi.fn(),
  getExportData: vi.fn(),
  getI18n: vi.fn(),
  renderToBuffer: vi.fn(),
  ExportPDFDocument: vi.fn(),
}));

vi.mock("@/lib/auth/auth-user", () => ({
  getSession: mocks.getSession,
  getRequiredUser: mocks.getRequiredUser,
  RECENT_AUTHENTICATION_WINDOW_MS: 10 * 60 * 1_000,
}));
vi.mock("@/features/account/user-data-export", () => ({
  buildUserDataExport: mocks.buildUserDataExport,
}));
vi.mock("@/features/account/json-download", () => ({
  createJsonDownloadStream: mocks.createJsonDownloadStream,
}));
vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: mocks.enforceRateLimit,
}));
vi.mock("@/features/export/export.action", () => ({
  getExportData: mocks.getExportData,
}));
vi.mock("@/features/export/pdf-document", () => ({
  ExportPDFDocument: mocks.ExportPDFDocument,
}));
vi.mock("@/i18n/server", () => ({ getI18n: mocks.getI18n }));
vi.mock("@react-pdf/renderer", () => ({
  renderToBuffer: mocks.renderToBuffer,
}));

import { GET as getJsonExport } from "@app/api/export/json/route";
import { GET as getPdfExport } from "@app/api/export/pdf/route";

describe("export routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRequiredUser.mockResolvedValue({ id: "user-1" });
    mocks.buildUserDataExport.mockResolvedValue({ exportMetadata: {} });
    mocks.createJsonDownloadStream.mockReturnValue("json-body");
    mocks.getI18n.mockResolvedValue({ locale: "fr", t: vi.fn() });
    mocks.ExportPDFDocument.mockReturnValue({ type: "pdf" });
    mocks.renderToBuffer.mockResolvedValue(Buffer.from("pdf-body"));
  });

  it("rejects a JSON export without an authenticated session", async () => {
    mocks.getSession.mockResolvedValue(null);
    const response = await getJsonExport();
    expect(response.status).toBe(401);
    expect(mocks.getRequiredUser).not.toHaveBeenCalled();
  });

  it.each(["invalid-date", new Date(Date.now() - 11 * 60 * 1_000)])(
    "requires recent authentication for JSON export: %s",
    async (createdAt) => {
      mocks.getSession.mockResolvedValue({
        user: { id: "user-1" },
        session: { createdAt },
      });
      const response = await getJsonExport();
      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        code: "recent_authentication_required",
      });
    },
  );

  it("streams a no-store JSON export after rate limiting", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "user-1" },
      session: { createdAt: new Date() },
    });
    const response = await getJsonExport();
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("json-body");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("content-disposition")).toMatch(
      /moodday-export-\d{4}-\d{2}-\d{2}\.json/u,
    );
    expect(mocks.enforceRateLimit).toHaveBeenCalledWith({
      scope: "full-data-export",
      identifier: "user-1",
      max: 3,
      windowSeconds: 60 * 60,
    });
  });

  it("rejects malformed or inverted PDF ranges", async () => {
    const missing = await getPdfExport(
      new Request("https://moodday.app/api/export/pdf"),
    );
    const inverted = await getPdfExport(
      new Request(
        "https://moodday.app/api/export/pdf?startDate=2026-08-19&endDate=2026-08-18",
      ),
    );
    expect(missing.status).toBe(400);
    expect(inverted.status).toBe(400);
    expect(mocks.getExportData).not.toHaveBeenCalled();
  });

  it.each([
    [{ serverError: "forbidden" }, "server error"],
    [{ data: undefined }, "missing data"],
  ])("fails closed when PDF data has a %s", async (result, _label) => {
    mocks.getExportData.mockResolvedValue(result);
    const response = await getPdfExport(
      new Request(
        "https://moodday.app/api/export/pdf?startDate=2026-08-01&endDate=2026-08-18",
      ),
    );
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      code: "export_unavailable",
    });
  });

  it("renders an accessible no-store PDF for a valid bounded range", async () => {
    mocks.getExportData.mockResolvedValue({ data: { moodEntries: [] } });
    const response = await getPdfExport(
      new Request(
        "https://moodday.app/api/export/pdf?startDate=2026-08-01&endDate=2026-08-18&preparationId=prep-1",
      ),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("content-disposition")).toContain(
      "moodday-export-2026-08-01-2026-08-18.pdf",
    );
    expect(mocks.getExportData).toHaveBeenCalledWith({
      startDate: "2026-08-01",
      endDate: "2026-08-18",
      preparationId: "prep-1",
      purpose: "consultation-report",
    });
    expect(mocks.renderToBuffer).toHaveBeenCalledTimes(1);
  });
});
