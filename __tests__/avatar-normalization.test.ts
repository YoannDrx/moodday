import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { normalizeAvatar } from "@/features/images/normalize-avatar";

describe("public avatar normalization", () => {
  it("decodes pixels, bounds dimensions and strips metadata and filename", async () => {
    const input = await sharp({
      create: { width: 900, height: 600, channels: 3, background: "red" },
    })
      .jpeg()
      .withMetadata({ exif: { IFD0: { Artist: "private name" } } })
      .toBuffer();
    const output = await normalizeAvatar(
      new File([new Uint8Array(input)], "private-name.jpg", {
        type: "image/jpeg",
      }),
    );
    const metadata = await sharp(
      Buffer.from(await output.arrayBuffer()),
    ).metadata();
    expect(output.name).toBe("avatar.webp");
    expect(metadata).toMatchObject({ format: "webp", width: 512 });
    expect(metadata.exif).toBeUndefined();
  });
  it.each(["image/svg+xml", "image/png", "image/jpeg"])(
    "rejects SVG content declared as %s",
    async (type) => {
      await expect(
        normalizeAvatar(
          new File(['<svg xmlns="http://www.w3.org/2000/svg"/>'], "avatar", {
            type,
          }),
        ),
      ).rejects.toThrow();
    },
  );
  it("rejects truncated raster files and oversized uploads", async () => {
    await expect(
      normalizeAvatar(
        new File([new Uint8Array([255, 216, 255])], "x.jpg", {
          type: "image/jpeg",
        }),
      ),
    ).rejects.toThrow("invalide");
    await expect(
      normalizeAvatar(
        new File([new Uint8Array(2 * 1024 * 1024 + 1)], "x.png", {
          type: "image/png",
        }),
      ),
    ).rejects.toThrow("2 Mo");
  });
});

it("refuses a raster above the decoded pixel budget and normalizes a valid PNG", async () => {
  const large = await sharp({
    create: { width: 5000, height: 4000, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  await expect(
    normalizeAvatar(
      new File([new Uint8Array(large)], "large.png", { type: "image/png" }),
    ),
  ).rejects.toThrow("dimensions");
  const small = await sharp({
    create: { width: 10, height: 10, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  // Extra metadata/trailing content can never survive the pixel-only re-encode.
  const output = await normalizeAvatar(
    new File(
      [
        new Uint8Array(
          Buffer.concat([
            small,
            Buffer.from("<script>private payload</script>"),
          ]),
        ),
      ],
      "small.png",
      { type: "image/png" },
    ),
  );
  const result = Buffer.from(await output.arrayBuffer());
  expect(result.toString()).not.toContain("private payload");
  expect((await sharp(result).metadata()).format).toBe("webp");
});
