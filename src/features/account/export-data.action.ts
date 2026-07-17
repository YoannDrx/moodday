"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { buildUserDataExport } from "./user-data-export";

// Kept for internal callers while the UI uses the streaming HTTP download.
export const exportUserData = authAction.action(async ({ ctx: { user } }) =>
  buildUserDataExport(user),
);
