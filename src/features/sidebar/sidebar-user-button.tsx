"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";
import { ChevronsUpDown } from "lucide-react";
import { UserDropdown } from "../auth/user-dropdown";

export const SidebarUserButton = () => {
  const session = useSession();
  const data = session.data?.user;

  return (
    <UserDropdown>
      <SidebarMenuButton
        variant="outline"
        className="h-12 rounded-xl border-gray-200 bg-gray-50/50 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100/80"
        data-testid="user-menu-button"
      >
        <Avatar className="size-8 rounded-lg shadow-sm ring-2 ring-white">
          <AvatarImage src={data?.image ?? ""} alt={data?.name[0]} />
          <AvatarFallback className="rounded-lg bg-gradient-to-br from-[var(--primary)] to-teal-400 text-white">
            {data?.name[0] ?? data?.email[0]}
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold text-gray-900">
            {data?.name}
          </span>
          <span className="truncate text-xs text-gray-500">{data?.email}</span>
        </div>
        <ChevronsUpDown className="ml-auto size-4 text-gray-400" />
      </SidebarMenuButton>
    </UserDropdown>
  );
};
