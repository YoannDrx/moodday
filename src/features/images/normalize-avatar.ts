import sharp from "sharp";
import { ActionError } from "@/lib/errors/action-error";

export async function normalizeAvatar(file: File): Promise<File> {
  if (
    !["image/png", "image/jpeg"].includes(file.type) ||
    file.size === 0 ||
    file.size > 2 * 1024 * 1024
  ) {
    throw new ActionError("Choisissez une image PNG ou JPEG de 2 Mo maximum.");
  }
  const input = Buffer.from(await file.arrayBuffer());
  const png = input
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = input[0] === 255 && input[1] === 216 && input[2] === 255;
  if (
    (file.type === "image/png" && !png) ||
    (file.type === "image/jpeg" && !jpeg)
  ) {
    throw new ActionError("Le contenu ne correspond pas au format de l’image.");
  }
  try {
    const decoder = sharp(input, {
      limitInputPixels: 16_000_000,
      failOn: "warning",
    });
    const metadata = await decoder.metadata();
    if ((metadata.pages ?? 1) !== 1) throw new Error("animated_image");
    // Re-encoding strips EXIF, GPS and original filenames from the public blob.
    const output = await decoder
      .rotate()
      .resize(512, 512, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    return new File([new Uint8Array(output)], "avatar.webp", {
      type: "image/webp",
    });
  } catch {
    throw new ActionError(
      "Cette image est invalide ou ses dimensions sont trop grandes.",
    );
  }
}
