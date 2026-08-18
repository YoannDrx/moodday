import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SatoriOptions } from "next/dist/compiled/@vercel/og/satori";

const readPublicFont = async (fileName: string) => {
  const font = await readFile(
    path.join(process.cwd(), "public", "fonts", fileName),
  );

  return Uint8Array.from(font).buffer;
};

export const getOgImageFont = async () => {
  const [interSemiBold, interBold] = await Promise.all([
    readPublicFont("Geist-SemiBold.otf"),
    readPublicFont("Geist-Black.otf"),
  ]);

  return [
    {
      name: "Geist",
      data: interSemiBold,
      style: "normal",
      weight: 400,
    },
    {
      name: "Geist",
      data: interBold,
      style: "normal",
      weight: 700,
    },
  ] satisfies SatoriOptions["fonts"];
};
