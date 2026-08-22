import type { ImageStyle, StyleProp } from "react-native";
import { Image } from "react-native";
import appointment from "../../assets/illustrations/appointment-chair.webp";
import checkIn from "../../assets/illustrations/check-in-pebbles.webp";
import circle from "../../assets/illustrations/circle-support.webp";
import connections from "../../assets/illustrations/connections-calendar.webp";
import brief from "../../assets/illustrations/consultation-brief.webp";
import landmarks from "../../assets/illustrations/landmarks-thread.webp";
import offline from "../../assets/illustrations/offline-boat.webp";
import plus from "../../assets/illustrations/plus-journal.webp";
import privacy from "../../assets/illustrations/privacy-journal.webp";
import safety from "../../assets/illustrations/safety-lighthouse.webp";
import treatment from "../../assets/illustrations/treatment-routine.webp";
import welcome from "../../assets/illustrations/welcome-journal.webp";

const illustrationSources = {
  welcome,
  checkIn,
  landmarks,
  appointment,
  treatment,
  circle,
  privacy,
  offline,
  safety,
  brief,
  plus,
  connections,
} as const;

export type BrandIllustrationVariant = keyof typeof illustrationSources;

export function BrandIllustration({
  variant,
  accessibilityLabel,
  style,
}: {
  variant: BrandIllustrationVariant;
  accessibilityLabel?: string;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={illustrationSources[variant]}
      resizeMode="contain"
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      style={style}
    />
  );
}
