/* eslint-disable no-console */
import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const migrations = readdirSync("prisma/migrations", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const hash = createHash("sha256");
for (const migration of migrations) {
  hash
    .update(migration)
    .update(
      readFileSync(join("prisma/migrations", migration, "migration.sql")),
    );
}
const schemas = readdirSync("prisma/schema").filter((name) =>
  name.endsWith(".prisma"),
);
const models = schemas
  .flatMap((name) =>
    [
      ...readFileSync(join("prisma/schema", name), "utf8").matchAll(
        /^model\s+(\w+)\s*\{/gm,
      ),
    ].map((match) => match[1]),
  )
  .sort();
console.log(
  JSON.stringify(
    {
      migrationCount: migrations.length,
      migrationsSha256: hash.digest("hex"),
      lastMigration: migrations.at(-1),
      modelCount: models.length,
      models,
    },
    null,
    2,
  ),
);
