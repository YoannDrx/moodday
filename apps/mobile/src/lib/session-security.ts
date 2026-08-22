type SessionInvalidationListener = () => void;

const listeners = new Set<SessionInvalidationListener>();
let invalidated = false;
let notificationScheduled = false;

export const isMobileSessionInvalidated = () => invalidated;

export const invalidateMobileSession = () => {
  if (invalidated) return;
  invalidated = true;
  if (notificationScheduled) return;
  notificationScheduled = true;

  // Let the rejected request finish its local cleanup before React closes the
  // SQLCipher connection. No further server request is authorized meanwhile.
  setTimeout(() => {
    notificationScheduled = false;
    for (const listener of listeners) listener();
  }, 0);
};

export const clearMobileSessionInvalidation = () => {
  invalidated = false;
};

export const subscribeToMobileSessionInvalidation = (
  listener: SessionInvalidationListener,
) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
