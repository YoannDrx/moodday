import { createHmac } from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const decodeBase32 = (value: string) => {
  let bits = "";
  for (const character of value.replaceAll("=", "").toUpperCase()) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index < 0) throw new Error("Invalid base32 TOTP secret");
    bits += index.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) {
    bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  }
  return Buffer.from(bytes);
};

export const generateTotpFromUri = (totpUri: string, now = Date.now()) => {
  const uri = new URL(totpUri);
  const secret = uri.searchParams.get("secret");
  if (!secret) throw new Error("TOTP URI does not contain a secret");
  const digits = Number(uri.searchParams.get("digits") ?? "6");
  const period = Number(uri.searchParams.get("period") ?? "30");
  const algorithm = (uri.searchParams.get("algorithm") ?? "SHA1")
    .replaceAll("-", "")
    .toLowerCase();

  const counter = BigInt(Math.floor(now / 1000 / period));
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(counter);
  const digest = createHmac(algorithm, decodeBase32(secret))
    .update(message)
    .digest();
  const offset = (digest.at(-1) ?? 0) & 0x0f;
  const binary =
    (((digest[offset] ?? 0) & 0x7f) << 24) |
    ((digest[offset + 1] ?? 0) << 16) |
    ((digest[offset + 2] ?? 0) << 8) |
    (digest[offset + 3] ?? 0);

  return (binary % 10 ** digits).toString().padStart(digits, "0");
};
