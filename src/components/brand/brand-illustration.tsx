import { cn } from "@/lib/utils";
import Image from "next/image";

const illustrations = {
  welcome: {
    src: "/brand/illustrations/welcome-journal.png",
    width: 1536,
    height: 1024,
  },
  checkIn: {
    src: "/brand/illustrations/check-in-pebbles.png",
    width: 1254,
    height: 1254,
  },
  landmarks: {
    src: "/brand/illustrations/landmarks-thread.png",
    width: 1672,
    height: 941,
  },
  appointment: {
    src: "/brand/illustrations/appointment-chair.png",
    width: 1312,
    height: 1199,
  },
  treatment: {
    src: "/brand/illustrations/treatment-routine.png",
    width: 1536,
    height: 1024,
  },
  circle: {
    src: "/brand/illustrations/circle-support.png",
    width: 1536,
    height: 1024,
  },
  privacy: {
    src: "/brand/illustrations/privacy-journal.png",
    width: 1236,
    height: 1272,
  },
  offline: {
    src: "/brand/illustrations/offline-boat.png",
    width: 1536,
    height: 1024,
  },
  safety: {
    src: "/brand/illustrations/safety-lighthouse.png",
    width: 1024,
    height: 1536,
  },
  brief: {
    src: "/brand/illustrations/consultation-brief.png",
    width: 1223,
    height: 1286,
  },
  plus: {
    src: "/brand/illustrations/plus-journal.png",
    width: 1254,
    height: 1254,
  },
  connections: {
    src: "/brand/illustrations/connections-calendar.png",
    width: 1536,
    height: 1024,
  },
} as const;

export type BrandIllustrationVariant = keyof typeof illustrations;

export function BrandIllustration({
  variant,
  alt = "",
  className,
  priority = false,
  sizes = "(max-width: 768px) 80vw, 420px",
}: {
  variant: BrandIllustrationVariant;
  alt?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const illustration = illustrations[variant];
  return (
    <Image
      src={illustration.src}
      width={illustration.width}
      height={illustration.height}
      alt={alt}
      priority={priority}
      sizes={sizes}
      className={cn("h-auto w-full object-contain select-none", className)}
      draggable={false}
    />
  );
}
