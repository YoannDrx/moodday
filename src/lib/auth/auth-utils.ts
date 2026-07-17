export const getCallbackUrl = (fallbackUrl: string): string => {
  const searchParams = new URLSearchParams(window.location.search);
  const callbackUrlParams = searchParams.get("callbackUrl");

  if (callbackUrlParams) {
    if (callbackUrlParams === "null") return "/";

    try {
      const callbackUrl = new URL(callbackUrlParams, window.location.origin);
      if (callbackUrl.origin !== window.location.origin) return fallbackUrl;

      return `${callbackUrl.pathname}${callbackUrl.search}${callbackUrl.hash}`;
    } catch {
      return fallbackUrl;
    }
  }

  return fallbackUrl;
};
