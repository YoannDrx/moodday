import { MoodDayMark } from "@/components/svg/moodday-mark";
import type { ComponentPropsWithoutRef } from "react";

type LogoSvgProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

export const LogoSvg = ({ size = 32, ...props }: LogoSvgProps) => (
  <MoodDayMark width={size} height={size} accentColor="#F3C9A8" {...props} />
);
