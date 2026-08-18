export type PushContentMode = "generic" | "detailed";

const storageKey = (ownerId: string) => `moodday.push.content-mode:${ownerId}`;

export const getPushContentMode = (ownerId: string): PushContentMode =>
  window.localStorage.getItem(storageKey(ownerId)) === "detailed"
    ? "detailed"
    : "generic";

export const setPushContentMode = (
  ownerId: string,
  mode: PushContentMode,
) => {
  window.localStorage.setItem(storageKey(ownerId), mode);
  window.dispatchEvent(
    new CustomEvent("moodday:push-content-mode", {
      detail: { ownerId, mode },
    }),
  );
};
