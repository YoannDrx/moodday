import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import resolveExpoConfig from "../apps/mobile/app.config";

const mobileRoot = path.join(process.cwd(), "apps/mobile");
const appConfig = JSON.parse(
  fs.readFileSync(path.join(mobileRoot, "app.json"), "utf8"),
) as {
  expo: Record<string, unknown> & {
    extra?: { eas?: { projectId?: string } };
    plugins?: unknown[];
  };
};
const easConfig = JSON.parse(
  fs.readFileSync(path.join(mobileRoot, "eas.json"), "utf8"),
) as {
  cli: { version: string; appVersionSource: string };
  build: Record<string, Record<string, unknown>>;
  submit: Record<string, unknown>;
};

describe("mobile delivery configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("isolates development, preview, E2E and production builds", () => {
    expect(easConfig.cli).toEqual({
      version: "22.2.0",
      appVersionSource: "remote",
    });
    expect(easConfig.build.development).toMatchObject({
      developmentClient: true,
      distribution: "internal",
      environment: "development",
      env: { APP_VARIANT: "development" },
    });
    expect(easConfig.build.preview).toMatchObject({
      distribution: "internal",
      environment: "preview",
      env: { APP_VARIANT: "preview" },
    });
    expect(easConfig.build["e2e-test"]).toMatchObject({
      withoutCredentials: true,
      environment: "preview",
      env: { APP_VARIANT: "preview" },
      ios: { simulator: true },
      android: { buildType: "apk" },
    });
    expect(easConfig.build.production).toMatchObject({
      autoIncrement: true,
      environment: "production",
      env: { APP_VARIANT: "production" },
    });
    expect(easConfig.submit).toEqual({
      production: { ios: { ascAppId: "6804466109" } },
    });
  });

  it("keeps the EAS build CLI outside the application dependency graph", () => {
    const mobilePackage = JSON.parse(
      fs.readFileSync(path.join(mobileRoot, "package.json"), "utf8"),
    ) as { devDependencies?: Record<string, string> };

    expect(mobilePackage.devDependencies).not.toHaveProperty("eas-cli");
  });

  it("links the native app to EAS and ships production-ready brand assets", () => {
    expect(appConfig.expo).toMatchObject({
      owner: "yoanndrx",
      slug: "mood-day",
      icon: "./assets/app-icon.png",
      extra: {
        eas: { projectId: "973b3a37-c1d3-4dac-a327-20d4b9bbd18e" },
      },
    });
    expect(appConfig.expo).not.toHaveProperty("newArchEnabled");
    expect(JSON.stringify(appConfig.expo.plugins)).toContain(
      "expo-splash-screen",
    );
    expect(JSON.stringify(appConfig.expo.plugins)).toContain(
      '"faceIDPermission":false',
    );
  });

  it("ships private local reminders and native account-data handoff", () => {
    const mobilePackage = JSON.parse(
      fs.readFileSync(path.join(mobileRoot, "package.json"), "utf8"),
    ) as { dependencies: Record<string, string> };
    const notifications = fs.readFileSync(
      path.join(mobileRoot, "src/lib/notifications.ts"),
      "utf8",
    );
    const accountData = fs.readFileSync(
      path.join(mobileRoot, "src/lib/account-data.ts"),
      "utf8",
    );

    expect(mobilePackage.dependencies).toMatchObject({
      "expo-file-system": "~55.0.25",
      "expo-notifications": "~55.0.26",
      "expo-sharing": "~55.0.23",
    });
    expect(notifications).toContain("SchedulableTriggerInputTypes.DATE");
    expect(notifications).toContain("Un rappel de traitement t’attend");
    expect(notifications).not.toContain("medication.name");
    expect(accountData).toContain("/api/export/json");
    expect(accountData).toContain("if (file.exists) file.delete()");
  });

  it("keeps EAS workflows manual and executes the versioned Maestro flow", () => {
    for (const platform of ["ios", "android"]) {
      const workflow = fs.readFileSync(
        path.join(mobileRoot, `.eas/workflows/e2e-${platform}.yml`),
        "utf8",
      );

      expect(workflow).toContain("workflow_dispatch: {}");
      expect(workflow).not.toContain("pull_request:");
      expect(workflow).toContain("profile: e2e-test");
      expect(workflow).toContain("type: maestro");
      expect(workflow).toContain("flow_path: .maestro/sign-in-smoke.yml");
    }
  });

  it("targets the isolated Preview app and stable accessibility identifiers", () => {
    const flow = fs.readFileSync(
      path.join(mobileRoot, ".maestro/sign-in-smoke.yml"),
      "utf8",
    );
    expect(flow).toContain("appId: fr.yodev.moodday.preview");
    expect(flow).toContain("openLink: moodday-preview://sign-in");
    expect(flow).toContain("id: sign-in-screen");
  });

  it("exposes Google authentication through the native Better Auth hand-off", () => {
    const signInScreen = fs.readFileSync(
      path.join(mobileRoot, "app/sign-in.tsx"),
      "utf8",
    );

    expect(signInScreen).toContain('testID="sign-in-google"');
    expect(signInScreen).toContain("authClient.signIn.social");
    expect(signInScreen).toContain('provider: "google"');
    expect(signInScreen).toContain('callbackURL: "/"');
    expect(signInScreen).toContain('testID="sign-in-apple"');
    expect(signInScreen).toContain('provider: "apple"');
  });

  it.each([
    {
      variant: "development",
      apiUrl: undefined,
      name: "Mood Day Dev",
      scheme: "moodday-dev",
      identifier: "fr.yodev.moodday.dev",
      resolvedApiUrl: "http://localhost:3000",
    },
    {
      variant: "preview",
      apiUrl: "https://preview.moodday.invalid",
      name: "Mood Day Preview",
      scheme: "moodday-preview",
      identifier: "fr.yodev.moodday.preview",
      resolvedApiUrl: "https://preview.moodday.invalid",
    },
    {
      variant: "production",
      apiUrl: "https://www.moodday.app",
      name: "Mood Day",
      scheme: "moodday",
      identifier: "fr.yodev.moodday",
      resolvedApiUrl: "https://www.moodday.app",
    },
  ])(
    "resolves the $variant app identity without cross-environment collisions",
    ({ variant, apiUrl, name, scheme, identifier, resolvedApiUrl }) => {
      vi.stubEnv("APP_VARIANT", variant);
      vi.stubEnv("EXPO_PUBLIC_API_URL", apiUrl ?? "");

      const resolved = resolveExpoConfig({
        config: { name: "Mood Day", slug: "mood-day" },
      } as never);

      expect(resolved).toMatchObject({
        name,
        scheme,
        ios: { bundleIdentifier: identifier, usesAppleSignIn: true },
        android: { package: identifier },
        extra: { appVariant: variant, apiUrl: resolvedApiUrl },
      });
      expect(JSON.stringify(resolved.plugins)).toContain("expo-notifications");
      expect(JSON.stringify(resolved.plugins)).toContain(
        '"remindersPermission":false',
      );
    },
  );

  it("fails closed when a distributed build has no HTTPS API", () => {
    vi.stubEnv("APP_VARIANT", "preview");
    vi.stubEnv("EXPO_PUBLIC_API_URL", "");
    expect(() =>
      resolveExpoConfig({
        config: { name: "Mood Day", slug: "mood-day" },
      } as never),
    ).toThrow("EXPO_PUBLIC_API_URL is required for the preview");

    vi.stubEnv("EXPO_PUBLIC_API_URL", "http://preview.moodday.invalid");
    expect(() =>
      resolveExpoConfig({
        config: { name: "Mood Day", slug: "mood-day" },
      } as never),
    ).toThrow("EXPO_PUBLIC_API_URL must use HTTPS for the preview");
  });

  it("allows the iOS-first RevenueCat release without an Android public key", () => {
    vi.stubEnv("APP_VARIANT", "production");
    vi.stubEnv("EXPO_PUBLIC_API_URL", "https://www.moodday.app");
    vi.stubEnv("EXPO_PUBLIC_REVENUECAT_ENABLED", "true");
    vi.stubEnv("EXPO_PUBLIC_REVENUECAT_IOS_API_KEY", "appl_public_test");
    vi.stubEnv("EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY", "");

    const resolved = resolveExpoConfig({
      config: { name: "Mood Day", slug: "mood-day", plugins: [] },
    } as never);

    expect(resolved.extra).toMatchObject({
      revenueCatEnabled: true,
      revenueCatIosApiKey: "appl_public_test",
      revenueCatAndroidApiKey: undefined,
    });
  });

  it("fails closed when iOS RevenueCat billing has no public iOS key", () => {
    vi.stubEnv("APP_VARIANT", "production");
    vi.stubEnv("EXPO_PUBLIC_API_URL", "https://www.moodday.app");
    vi.stubEnv("EXPO_PUBLIC_REVENUECAT_ENABLED", "true");
    vi.stubEnv("EXPO_PUBLIC_REVENUECAT_IOS_API_KEY", "");

    expect(() =>
      resolveExpoConfig({
        config: { name: "Mood Day", slug: "mood-day", plugins: [] },
      } as never),
    ).toThrow("RevenueCat iOS public API key is required");
  });
});
