/* eslint-disable no-console, no-await-in-loop */
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { createUserDataExportStream } from "../src/features/account/user-data-export";
import { prisma } from "../src/lib/prisma";

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  assert.ok(
    ["localhost", "127.0.0.1"].includes(url.hostname),
    "Disposable local database required",
  );
  const id = `export-benchmark-${randomUUID()}`;
  const count = 10_000;
  const runs = 20;
  const concurrency = 4;
  try {
    await prisma.user.create({
      data: {
        id,
        name: "Synthetic export benchmark",
        emailVerified: true,
        email: `${id}@example.invalid`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    for (let offset = 0; offset < count; offset += 500) {
      await prisma.dailyCheckIn.createMany({
        data: Array.from({ length: 500 }, (_, index) => ({
          userId: id,
          operationId: `${id}-${offset + index}`,
          // One check-in per civil day: spread fixtures over distinct dates.
          localDate: new Date(Date.UTC(2000, 0, 1 + offset + index)),
          timezone: "Europe/Paris",
          state: "fragile" as const,
          symptoms: ["fatigue"],
          needs: ["calm"],
          privateNote: "Synthetic 🧪 private export fixture. ".repeat(30),
        })),
      });
    }
    const times: number[] = [];
    let bytes = 0;
    let peakRss = process.memoryUsage().rss;
    const sampler = setInterval(() => {
      peakRss = Math.max(peakRss, process.memoryUsage().rss);
    }, 10);
    try {
      const exportOnce = async () => {
        const start = performance.now();
        const hash = createHash("sha256");
        const reader = createUserDataExportStream({ id }).getReader();
        let exportBytes = 0;
        for (;;) {
          const part = await reader.read();
          if (part.done) break;
          exportBytes += part.value.byteLength;
          hash.update(part.value);
        }
        bytes = exportBytes;
        assert.ok(exportBytes > count * 1000);
        assert.equal(hash.digest("hex").length, 64);
        peakRss = Math.max(peakRss, process.memoryUsage().rss);
        times.push(performance.now() - start);
      };
      for (let run = 0; run < runs; run += concurrency) {
        await Promise.all(Array.from({ length: concurrency }, exportOnce));
      }
    } finally {
      clearInterval(sampler);
    }
    times.sort((a, b) => a - b);
    const p95 = times[Math.ceil(runs * 0.95) - 1];
    const p99 = times[Math.ceil(runs * 0.99) - 1];
    const result = {
      synthetic: true,
      records: count,
      runs,
      concurrency,
      bytes,
      p95Ms: Math.round(p95),
      p99Ms: Math.round(p99),
      peakRssMiB: Math.round(peakRss / 1024 / 1024),
      budget: { p95Ms: 10000, peakRssMiB: 512 },
      scope:
        "local exports of one synthetic account at four concurrent requests, including database read and streamed serialization; p99 is sample maximum",
    };
    console.log(JSON.stringify(result));
    assert.ok(
      p95 < 10000 && peakRss < 512 * 1024 * 1024,
      "Export budget exceeded; require pagination/background export before rollout",
    );
  } finally {
    await prisma.user.deleteMany({ where: { id } });
    await prisma.$disconnect();
  }
}
void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "benchmark_failed");
  process.exitCode = 1;
});
