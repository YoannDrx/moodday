import type { ConfigContext, ExpoConfig } from "expo/config";

type AppVariant = "development" | "preview" | "production";

const getVariant = (): AppVariant => {
  const value = process.env.APP_VARIANT;
  if (value === "preview" || value === "production") return value;
  return "development";
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = getVariant();
  const suffix =
    variant === "production" ? "" : variant === "preview" ? ".preview" : ".dev";
  const scheme =
    variant === "production"
      ? "moodday"
      : variant === "preview"
        ? "moodday-preview"
        : "moodday-dev";

  return {
    ...config,
    name: variant === "production" ? "Mood Day" : `Mood Day ${variant}`,
    slug: "mood-day",
    scheme,
    ios: {
      ...config.ios,
      bundleIdentifier: `fr.yodev.moodday${suffix}`,
    },
    android: {
      ...config.android,
      package: `fr.yodev.moodday${suffix}`,
    },
    extra: {
      ...config.extra,
      appVariant: variant,
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000",
    },
  };
};
