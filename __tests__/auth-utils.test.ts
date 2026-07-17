import { getCallbackUrl } from "@/lib/auth/auth-utils";
import { beforeEach, describe, expect, it } from "vitest";

describe("getCallbackUrl", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "http://localhost:3000/auth/signin");
  });

  it("returns the fallback when no callback URL is provided", () => {
    expect(getCallbackUrl("/dashboard")).toBe("/dashboard");
  });

  it("allows same-origin relative callback URLs", () => {
    window.history.pushState(
      {},
      "",
      "http://localhost:3000/auth/signin?callbackUrl=/settings/profile",
    );

    expect(getCallbackUrl("/dashboard")).toBe("/settings/profile");
  });

  it("normalizes path-like callback URLs", () => {
    window.history.pushState(
      {},
      "",
      "http://localhost:3000/auth/signin?callbackUrl=settings/profile",
    );

    expect(getCallbackUrl("/dashboard")).toBe("/settings/profile");
  });

  it("rejects external callback URLs", () => {
    window.history.pushState(
      {},
      "",
      "http://localhost:3000/auth/signin?callbackUrl=https%3A%2F%2Fevil.example",
    );

    expect(getCallbackUrl("/dashboard")).toBe("/dashboard");
  });

  it("rejects protocol-relative callback URLs", () => {
    window.history.pushState(
      {},
      "",
      "http://localhost:3000/auth/signin?callbackUrl=%2F%2Fevil.example",
    );

    expect(getCallbackUrl("/dashboard")).toBe("/dashboard");
  });
});
