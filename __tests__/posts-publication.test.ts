import fs from "fs/promises";
import { afterEach, expect, it, vi } from "vitest";
import {
  getPosts,
  getCurrentPost,
  getPostsTags,
} from "@/features/posts/post-manager";
vi.mock("fs/promises", () => ({
  default: { access: vi.fn(), readdir: vi.fn(), readFile: vi.fn() },
}));
const post = (status = "published", tags = "tags: [care, routine]") =>
  `---\ntitle: Fixture\ndescription: Synthetic\nkeywords: [care]\nstatus: ${status}\ncoverUrl: /image.png\ndate: 2026-10-02\n${tags}\n---\nBody`;
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});
it("hides drafts and invalid metadata in production while filtering tags", async () => {
  vi.stubEnv("VERCEL_ENV", "production");
  vi.mocked(fs.readdir).mockResolvedValue([
    "valid.mdx",
    "draft.mdx",
    "invalid.mdx",
    "untagged.mdx",
  ] as never);
  vi.mocked(fs.readFile).mockImplementation(async (path) =>
    String(path).endsWith("draft.mdx")
      ? post("draft")
      : String(path).endsWith("invalid.mdx")
        ? "invalid"
        : String(path).endsWith("untagged.mdx")
          ? post("published", "")
          : post(),
  );
  expect((await getPosts(["care"])).map((item) => item.slug)).toEqual([
    "valid",
  ]);
  expect(await getPostsTags()).toEqual(["care", "routine"]);
  expect(await getCurrentPost("draft")).toBeUndefined();
  expect(await getCurrentPost("invalid")).toBeUndefined();
});
it("falls back to French when a localized directory or article is absent", async () => {
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.mocked(fs.access).mockRejectedValue(new Error("missing"));
  vi.mocked(fs.readdir).mockResolvedValue(["draft.mdx"] as never);
  vi.mocked(fs.readFile).mockResolvedValue(post("draft"));
  expect(await getPosts(undefined, "en")).toHaveLength(1);
  vi.mocked(fs.readFile)
    .mockRejectedValueOnce(new Error("missing translation"))
    .mockResolvedValueOnce(post());
  expect(await getCurrentPost("translated", "en")).toMatchObject({
    content: "Body",
  });
  vi.mocked(fs.readFile).mockRejectedValue(new Error("missing"));
  expect(await getCurrentPost("absent", "fr")).toBeUndefined();
});
