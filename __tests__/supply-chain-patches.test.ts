import { lstat, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const maliciousSymlinkArchive = Buffer.from(
  "UEsDBAoAAAAAADlyEl1ASv+xDQAAAA0AAAAGABwAZXNjYXBlVVQJAANtTYRqbU2EanV4CwABBPUBAAAEAAAAAC4uLy4uL291dHNpZGVQSwECHgMKAAAAAAA5chJdQEr/sQ0AAAANAAAABgAYAAAAAAAAAAAA7aEAAAAAZXNjYXBlVVQFAANtTYRqdXgLAAEE9QEAAAQAAAAAUEsFBgAAAAABAAEATAAAAE0AAAAAAA==",
  "base64",
);

type ExtractZip = (
  archivePath: string,
  options: { dir: string },
) => Promise<void>;

const loadPatchedExtractZip = async (): Promise<ExtractZip> => {
  const pnpmStore = path.join(process.cwd(), "node_modules", ".pnpm");
  const packageDirectory = (await readdir(pnpmStore)).find((entry) =>
    entry.startsWith("extract-zip@2.0.1_patch_hash="),
  );

  if (!packageDirectory) {
    throw new Error("patched_extract_zip_not_installed");
  }

  const require = createRequire(import.meta.url);
  return require(
    path.join(pnpmStore, packageDirectory, "node_modules", "extract-zip"),
  ) as ExtractZip;
};

describe("supply-chain patches", () => {
  it("rejects an archive whose symlink target escapes the extraction root", async () => {
    const workspace = await mkdtemp(
      path.join(tmpdir(), "moodday-extract-zip-"),
    );
    const archivePath = path.join(workspace, "malicious.zip");
    const destination = path.join(workspace, "destination");

    try {
      await writeFile(archivePath, maliciousSymlinkArchive, { mode: 0o600 });
      const extract = await loadPatchedExtractZip();

      await expect(extract(archivePath, { dir: destination })).rejects.toThrow(
        "Out of bound symlink target",
      );
      await expect(
        lstat(path.join(destination, "escape")),
      ).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });
});
