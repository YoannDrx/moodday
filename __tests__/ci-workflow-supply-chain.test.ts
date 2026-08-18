import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const workflowDirectory = path.join(process.cwd(), ".github/workflows");

describe("CI workflow supply chain", () => {
  it("pins every remote action to an immutable commit SHA", () => {
    const workflowFiles = fs
      .readdirSync(workflowDirectory)
      .filter((fileName) => fileName.endsWith(".yml"));
    const remoteActions = workflowFiles.flatMap((fileName) => {
      const workflow = fs.readFileSync(
        path.join(workflowDirectory, fileName),
        "utf8",
      );

      return [...workflow.matchAll(/^\s*(?:-\s*)?uses:\s*([^\s#]+)/gm)]
        .map((match) => match[1])
        .filter((action): action is string =>
          Boolean(
            action &&
              !action.startsWith("./") &&
              !action.startsWith("docker://"),
          ),
        )
        .map((action) => ({ action, fileName }));
    });

    expect(remoteActions.length).toBeGreaterThan(0);
    expect(remoteActions).toEqual(
      remoteActions.map(({ action: _action, fileName }) => ({
        action: expect.stringMatching(/^[^@\s]+@[0-9a-f]{40}$/),
        fileName,
      })),
    );
  });

  it("runs JavaScript tooling only from the frozen workspace lockfile", () => {
    const networkExecutions = fs
      .readdirSync(workflowDirectory)
      .filter((fileName) => fileName.endsWith(".yml"))
      .flatMap((fileName) => {
        const workflow = fs.readFileSync(
          path.join(workflowDirectory, fileName),
          "utf8",
        );

        return [...workflow.matchAll(/\b(?:pnpm\s+dlx|npx)\b|@latest\b/g)].map(
          (match) => ({ fileName, expression: match[0] }),
        );
      });

    expect(networkExecutions).toEqual([]);
  });

  it("allows only the extract-zip advisory covered by the mandatory patch test", () => {
    const workflow = fs.readFileSync(
      path.join(workflowDirectory, "code-quality.yml"),
      "utf8",
    );
    const allowedAdvisories = [
      ...workflow.matchAll(/^\s*allow-ghsas:\s*(.+)$/gm),
    ].map((match) => match[1].trim());

    expect(allowedAdvisories).toEqual(["GHSA-jmr9-qjv8-65gv"]);
    expect(workflow).toContain("pnpm test:coverage:release");
  });
});
