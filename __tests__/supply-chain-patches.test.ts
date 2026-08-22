import {
  lstat,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
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

const loadTransitiveUuid = async (
  packageDirectoryPrefix: string,
  packagePath: string,
): Promise<{ v4: () => string }> => {
  const pnpmStore = path.join(process.cwd(), "node_modules", ".pnpm");
  const packageDirectory = (await readdir(pnpmStore)).find((entry) =>
    entry.startsWith(packageDirectoryPrefix),
  );

  if (!packageDirectory) {
    throw new Error(`transitive_package_not_installed:${packageDirectoryPrefix}`);
  }

  const require = createRequire(
    path.join(
      pnpmStore,
      packageDirectory,
      "node_modules",
      packagePath,
      "package.json",
    ),
  );

  return require("uuid") as { v4: () => string };
};

describe("supply-chain patches", () => {
  it("locks corrected Valibot, Babel and UUID releases", async () => {
    const lockfile = await readFile(
      path.join(process.cwd(), "pnpm-lock.yaml"),
      "utf8",
    );
    const resolvedPackages = lockfile.slice(lockfile.indexOf("\npackages:\n"));

    expect(resolvedPackages).toContain("valibot@1.4.2:");
    expect(resolvedPackages).toContain("uuid@11.1.1:");
    expect(resolvedPackages).toContain("'@babel/core@7.29.7':");
    expect(resolvedPackages).not.toContain("valibot@1.0.0-beta.15:");
    expect(resolvedPackages).not.toContain("uuid@7.0.3:");
    expect(resolvedPackages).not.toContain("uuid@8.3.2:");
    expect(resolvedPackages).not.toContain("'@babel/core@7.28.4':");
  });

  it("keeps the UUID v4 API used by Expo xcode and Lighthouse", async () => {
    const [xcodeUuid, lighthouseUuid] = await Promise.all([
      loadTransitiveUuid("xcode@3.0.1", "xcode"),
      loadTransitiveUuid("@lhci+cli@0.15.1_", "@lhci/cli"),
    ]);

    expect(xcodeUuid.v4()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(lighthouseUuid.v4()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

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
