import type { ConfigContext, ExpoConfig } from "expo/config";

type AppVariant = "development" | "preview" | "production";

const variantNames: Record<AppVariant, string> = {
  development: "Mood Day Dev",
  preview: "Mood Day Preview",
  production: "Mood Day",
};

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
  const apiUrlValue = process.env.EXPO_PUBLIC_API_URL?.trim();
  const configuredApiUrl = apiUrlValue === "" ? undefined : apiUrlValue;

  if (variant !== "development" && !configuredApiUrl) {
    throw new Error(
      `EXPO_PUBLIC_API_URL is required for the ${variant} mobile variant.`,
    );
  }

  const apiUrl = configuredApiUrl ?? "http://localhost:3000";
  if (variant !== "development" && !apiUrl.startsWith("https://")) {
    throw new Error(
      `EXPO_PUBLIC_API_URL must use HTTPS for the ${variant} mobile variant.`,
    );
  }

  return {
    ...config,
    name: variantNames[variant],
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
      apiUrl,
    },
  };
};
