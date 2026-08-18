import { afterEach, describe, expect, it, vi } from "vitest";

import { buildContentSecurityPolicy } from "../proxy";

describe("Content Security Policy", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses a nonce and excludes unsafe script directives in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    const policy = buildContentSecurityPolicy("nonce-test");

    expect(policy).toContain(
      "script-src 'self' 'nonce-nonce-test' 'strict-dynamic'",
    );
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy.match(/script-src[^;]*/)?.[0]).not.toContain(
      "'unsafe-inline'",
    );
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
  });

  it("permits eval only for the local development toolchain", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(buildContentSecurityPolicy("dev")).toContain("'unsafe-eval'");
  });
});
