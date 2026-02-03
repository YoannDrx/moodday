"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth-client";
import { ChevronsUpDown } from "lucide-react";
import { useEffect } from "react";
import { UserDropdown } from "../auth/user-dropdown";

type SidebarUserButtonProps = {
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
};

export const SidebarUserButton = ({
  user: userProp,
}: SidebarUserButtonProps) => {
  // Use session as fallback when user prop is not provided
  const { data: sessionData, refetch } = useSession();
  const sessionUser = sessionData?.user;

  // Refetch session on mount to ensure client-side session is synchronized
  // This fixes the issue where session isn't available after navigation from login
  useEffect(() => {
    if (!sessionUser && !userProp) {
      refetch();
    }
  }, [sessionUser, userProp, refetch]);

  // Prefer prop user (server-side), fallback to session user (client-side)
  const user = userProp ?? sessionUser;

  // Show skeleton while loading (only when no prop user and session is loading)
  if (!user) {
    return (
      <div className="flex h-12 items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/50 px-3">
        <Skeleton className="size-8 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  return (
    <UserDropdown user={user}>
      <SidebarMenuButton
        variant="outline"
        className="h-12 rounded-xl border-gray-200 bg-gray-50/50 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100/80"
        data-testid="user-menu-button"
      >
        <Avatar className="size-8 rounded-lg shadow-sm ring-2 ring-white">
          <AvatarImage src={user.image ?? ""} alt={user.name?.[0] ?? "U"} />
          <AvatarFallback className="rounded-lg bg-gradient-to-br from-[var(--primary)] to-teal-400 text-white">
            {user.name?.[0] || user.email?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold text-gray-900">
            {user.name}
          </span>
          <span className="truncate text-xs text-gray-500">{user.email}</span>
        </div>
        <ChevronsUpDown className="ml-auto size-4 text-gray-400" />
      </SidebarMenuButton>
    </UserDropdown>
  );
};
