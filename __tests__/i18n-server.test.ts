import { expect, it, vi } from "vitest";
import { cookies, headers } from "next/headers";
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn() }));
vi.unmock("@/i18n/server");
import { getI18n, getLocale, isLocale } from "@/i18n/server";
it.each([
  ["fr", "en-US", "fr"],
  ["invalid", "de-DE,en-US;q=0.8,fr;q=0.5", "en"],
  [undefined, null, "fr"],
  [undefined, "de-DE", "fr"],
])(
  "resolves locale from cookie %s and header %s",
  async (cookie, header, expected) => {
    vi.mocked(cookies).mockResolvedValue({
      get: () => (cookie ? { value: cookie } : undefined),
    } as never);
    vi.mocked(headers).mockResolvedValue({ get: () => header } as never);
    expect(await getLocale()).toBe(expected);
    const i18n = await getI18n();
    expect(i18n.locale).toBe(expected);
    expect(i18n.t("missing.key")).toBe("missing.key");
    expect(i18n.tm("missing.key")).toBeUndefined();
    expect(isLocale("xx")).toBe(false);
  },
);
