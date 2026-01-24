import { useEffect, useState } from "react";

/**
 * Hook to detect if the component has been hydrated on the client.
 * Use this to conditionally render content that differs between SSR and client.
 *
 * @returns true after the component has mounted on the client, false during SSR
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}
