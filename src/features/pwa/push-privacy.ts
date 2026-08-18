export type PushContentMode = "generic" | "detailed";

export const getEffectivePushContentMode = (params: {
  contentMode: string;
  trustedDevice: boolean;
}): PushContentMode =>
  params.trustedDevice && params.contentMode === "detailed"
    ? "detailed"
    : "generic";
