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

  const revenueCatEnabled =
    process.env.EXPO_PUBLIC_REVENUECAT_ENABLED === "true";
  const iosRevenueCatValue =
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim();
  const androidRevenueCatValue =
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim();
  const revenueCatIosApiKey =
    iosRevenueCatValue === "" ? undefined : iosRevenueCatValue;
  const revenueCatAndroidApiKey =
    androidRevenueCatValue === "" ? undefined : androidRevenueCatValue;
  if (variant !== "development" && revenueCatEnabled && !revenueCatIosApiKey) {
    throw new Error(
      "The RevenueCat iOS public API key is required when mobile billing is enabled.",
    );
  }

  return {
    ...config,
    name: variantNames[variant],
    slug: "mood-day",
    scheme,
    plugins: [
      ...(config.plugins ?? []),
      [
        "@kingstinct/react-native-healthkit",
        {
          NSHealthShareUsageDescription:
            "Mood Day lit uniquement les données Santé que tu choisis afin de créer des repères journaliers sur ton appareil.",
          NSHealthUpdateUsageDescription:
            "Mood Day n’écrit aucune donnée dans Santé.",
          background: false,
        },
      ],
      [
        "expo-calendar",
        {
          calendarPermission:
            "Mood Day accède au calendrier uniquement lorsque tu choisis d’ajouter ou d’importer un rendez-vous.",
          remindersPermission: false,
        },
      ],
      [
        "expo-notifications",
        {
          enableBackgroundRemoteNotifications: false,
        },
      ],
    ],
    ios: {
      ...config.ios,
      bundleIdentifier: `fr.yodev.moodday${suffix}`,
      usesAppleSignIn: true,
    },
    android: {
      ...config.android,
      package: `fr.yodev.moodday${suffix}`,
    },
    extra: {
      ...config.extra,
      appVariant: variant,
      apiUrl,
      revenueCatEnabled,
      revenueCatIosApiKey,
      revenueCatAndroidApiKey,
    },
  };
};
