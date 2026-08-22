import { createHash } from "node:crypto";

const stableJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value).sort(([left], [right]) =>
      left.localeCompare(right),
    );
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  }
  if (value === undefined) return '"[undefined]"';
  const serialized = JSON.stringify(value) as string | undefined;
  return serialized ?? '"[unsupported]"';
};

export const createPayloadDigest = (value: unknown) =>
  createHash("sha256").update(stableJson(value)).digest("hex");
