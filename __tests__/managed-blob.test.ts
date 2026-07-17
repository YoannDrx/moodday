import { describe, expect, it } from "vitest";

import { isManagedMooddayBlobUrl } from "../src/lib/files/vercel-blob-adapter";

describe("managed Moodday blobs", () => {
  it("recognizes current and legacy profile image paths", () => {
    expect(
      isManagedMooddayBlobUrl(
        "https://store.public.blob.vercel-storage.com/profile-images/user-1/avatar.png",
      ),
    ).toBe(true);
    expect(
      isManagedMooddayBlobUrl(
        "https://store.public.blob.vercel-storage.com/images/legacy.png",
      ),
    ).toBe(true);
  });

  it("never treats external or deceptive URLs as managed", () => {
    expect(isManagedMooddayBlobUrl("https://example.com/avatar.png")).toBe(
      false,
    );
    expect(
      isManagedMooddayBlobUrl(
        "https://store.public.blob.vercel-storage.com.evil.test/profile-images/avatar.png",
      ),
    ).toBe(false);
    expect(isManagedMooddayBlobUrl("not-a-url")).toBe(false);
  });
});
