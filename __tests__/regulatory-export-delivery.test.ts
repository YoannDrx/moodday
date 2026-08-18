import {
  createRegulatoryExportDownloadCredential,
  deletePrivateRegulatoryExport,
  getRegulatoryExportBlobPath,
  getRegulatoryExportTokenDigest,
  publishPrivateRegulatoryExport,
  readPrivateRegulatoryExport,
} from "@/features/account/regulatory-export-delivery";
import { del, get, put } from "@vercel/blob";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@vercel/blob", () => ({
  del: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
}));

const REFERENCE = "A".repeat(43);
const SECRET = `test-only-${"a".repeat(32)}`;

describe("regulatory export private delivery", () => {
  beforeEach(() => {
    vi.mocked(del).mockReset();
    vi.mocked(get).mockReset();
    vi.mocked(put).mockReset();
  });

  it("derives an opaque fixed path and rejects malformed references", () => {
    expect(getRegulatoryExportBlobPath(REFERENCE)).toBe(
      `regulatory-exports/${REFERENCE}.json.enc`,
    );
    expect(() => getRegulatoryExportBlobPath("../unsafe")).toThrow(
      "Invalid regulatory export request reference",
    );
  });

  it("creates a random credential and only exposes its HMAC digest to storage", () => {
    const first = createRegulatoryExportDownloadCredential(SECRET, REFERENCE);
    const second = createRegulatoryExportDownloadCredential(SECRET, REFERENCE);

    expect(first.token).toHaveLength(43);
    expect(first.digest).toBe(
      getRegulatoryExportTokenDigest(SECRET, REFERENCE, first.token),
    );
    expect(first.token).not.toBe(second.token);
    expect(first.digest).not.toContain(first.token);
    expect(() =>
      getRegulatoryExportTokenDigest("short", REFERENCE, first.token),
    ).toThrow("Invalid regulatory export secret");
    expect(() =>
      getRegulatoryExportTokenDigest(SECRET, "unsafe", first.token),
    ).toThrow("Invalid regulatory export request reference");
    expect(() =>
      getRegulatoryExportTokenDigest(SECRET, REFERENCE, "short"),
    ).toThrow("Invalid regulatory export token");
  });

  it("publishes and reads only through the private Blob API", async () => {
    vi.mocked(put).mockResolvedValue({
      url: "https://store.private.blob.vercel-storage.com/file",
      downloadUrl:
        "https://store.private.blob.vercel-storage.com/file?download=1",
      pathname: `regulatory-exports/${REFERENCE}.json.enc`,
      contentType: "application/octet-stream",
      contentDisposition: "attachment",
    } as never);
    vi.mocked(get).mockResolvedValue(null);

    await publishPrivateRegulatoryExport({
      requestReference: REFERENCE,
      encryptedBody: "encrypted",
      blobToken: "blob-token",
    });
    await readPrivateRegulatoryExport({
      requestReference: REFERENCE,
      blobToken: "blob-token",
    });

    expect(put).toHaveBeenCalledWith(
      `regulatory-exports/${REFERENCE}.json.enc`,
      expect.any(Buffer),
      expect.objectContaining({
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: false,
        token: "blob-token",
      }),
    );
    expect(get).toHaveBeenCalledWith(
      `regulatory-exports/${REFERENCE}.json.enc`,
      { access: "private", useCache: false, token: "blob-token" },
    );
  });

  it("deletes only the dedicated regulatory export namespace", async () => {
    await deletePrivateRegulatoryExport({
      resourceLocator: `regulatory-exports/${REFERENCE}.json.enc`,
      blobToken: "blob-token",
    });
    expect(del).toHaveBeenCalledWith(
      `regulatory-exports/${REFERENCE}.json.enc`,
      { token: "blob-token" },
    );
    await expect(
      deletePrivateRegulatoryExport({
        resourceLocator: "profile-images/user/avatar.png",
        blobToken: "blob-token",
      }),
    ).rejects.toThrow("Invalid regulatory export resource locator");
    await expect(
      deletePrivateRegulatoryExport({
        resourceLocator: `regulatory-exports/${REFERENCE}.txt`,
        blobToken: "blob-token",
      }),
    ).rejects.toThrow("Invalid regulatory export resource locator");
    await expect(
      deletePrivateRegulatoryExport({
        resourceLocator: "regulatory-exports/../unsafe.json.enc",
        blobToken: "blob-token",
      }),
    ).rejects.toThrow("Invalid regulatory export resource locator");
  });
});
