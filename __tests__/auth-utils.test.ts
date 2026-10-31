import { getCallbackUrl } from "@/lib/auth/auth-utils";
import { beforeEach, describe, expect, it } from "vitest";

describe("getCallbackUrl", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "http://localhost:3000/auth/signin");
  });

  it("returns the fallback when no callback URL is provided", () => {
    expect(getCallbackUrl("/today")).toBe("/today");
  });

  it("normalizes the literal null callback to the public home page", () => {
    window.history.pushState(
      {},
      "",
      "http://localhost:3000/auth/signin?callbackUrl=null",
    );

    expect(getCallbackUrl("/today")).toBe("/");
  });

  it("allows same-origin relative callback URLs", () => {
    window.history.pushState(
      {},
      "",
      "http://localhost:3000/auth/signin?callbackUrl=/settings/profile",
    );

    expect(getCallbackUrl("/today")).toBe("/settings/profile");
  });

  it("normalizes path-like callback URLs", () => {
    window.history.pushState(
      {},
      "",
      "http://localhost:3000/auth/signin?callbackUrl=settings/profile",
    );

    expect(getCallbackUrl("/today")).toBe("/settings/profile");
  });

  it("rejects external callback URLs", () => {
    window.history.pushState(
      {},
      "",
      "http://localhost:3000/auth/signin?callbackUrl=https%3A%2F%2Fevil.example",
    );

    expect(getCallbackUrl("/today")).toBe("/today");
  });

  it("rejects protocol-relative callback URLs", () => {
    window.history.pushState(
      {},
      "",
      "http://localhost:3000/auth/signin?callbackUrl=%2F%2Fevil.example",
    );

    expect(getCallbackUrl("/today")).toBe("/today");
  });

  it("falls back when URL normalization throws", () => {
    window.history.pushState(
      {},
      "",
      "http://localhost:3000/auth/signin?callbackUrl=/today",
    );
    const OriginalURL = globalThis.URL;
    globalThis.URL = function ThrowingURL() {
      throw new TypeError("invalid URL");
    } as unknown as typeof URL;

    try {
      expect(getCallbackUrl("/safe")).toBe("/safe");
    } finally {
      globalThis.URL = OriginalURL;
    }
  });
});
