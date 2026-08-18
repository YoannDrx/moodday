import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type PnpmLicenseEntry = {
  name: string;
  versions: string[];
  license: string;
};

type PnpmLicenseReport = Record<string, PnpmLicenseEntry[]>;

const report = JSON.parse(
  execFileSync(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    ["licenses", "list", "--prod", "--json"],
    { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
  ),
) as PnpmLicenseReport;

const components = new Map<
  string,
  {
    type: "library";
    name: string;
    version: string;
    licenses: { license: { id?: string; name?: string } }[];
    purl: string;
    "bom-ref": string;
  }
>();

for (const entries of Object.values(report)) {
  for (const entry of entries) {
    for (const version of entry.versions) {
      const encodedName = entry.name
        .split("/")
        .map((part) => encodeURIComponent(part))
        .join("/");
      const purl = `pkg:npm/${encodedName}@${encodeURIComponent(version)}`;
      const spdxLike = /^[A-Za-z0-9-.+]+$/.test(entry.license);
      components.set(purl, {
        type: "library",
        name: entry.name,
        version,
        licenses: [
          {
            license: spdxLike ? { id: entry.license } : { name: entry.license },
          },
        ],
        purl,
        "bom-ref": purl,
      });
    }
  }
}

const rootRef = "pkg:npm/moodday@1.0.0";
const sortedComponents = [...components.values()].sort((a, b) =>
  a.purl.localeCompare(b.purl),
);
const bom = {
  bomFormat: "CycloneDX",
  specVersion: "1.6",
  serialNumber: "urn:uuid:00000000-0000-4000-8000-000000000001",
  version: 1,
  metadata: {
    component: {
      type: "application",
      name: "moodday",
      version: "1.0.0",
      purl: rootRef,
      "bom-ref": rootRef,
    },
    tools: {
      components: [
        {
          type: "application",
          name: "Moodday pnpm SBOM generator",
          version: "1",
        },
      ],
    },
  },
  components: sortedComponents,
  dependencies: [
    {
      ref: rootRef,
      dependsOn: sortedComponents.map((component) => component["bom-ref"]),
    },
  ],
};

const outputDirectory = resolve(process.cwd(), "artifacts");
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(
  resolve(outputDirectory, "sbom.cdx.json"),
  `${JSON.stringify(bom, null, 2)}\n`,
  "utf8",
);

process.stdout.write(
  `CycloneDX SBOM generated with ${components.size} components.\n`,
);
