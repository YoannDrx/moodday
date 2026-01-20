"use client";

import { useSession } from "@/lib/auth-client";

export const useCurrentUser = () => {
  const { data } = useSession();

  // For now, return basic user info. In a real app, you'd want to
  // fetch the full user data with subscription from an API
  const user = data?.user;

  if (!user) return null;

  return {
    ...user,
    subscription: null, // TODO: Implement subscription fetching
  };
};
