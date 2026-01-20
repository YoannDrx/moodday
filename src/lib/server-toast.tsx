import { cookies } from "next/headers";
import type { ServerToastEnum } from "../features/server-sonner/server-toast.schema";

/**
 * Server Toast is a equivalent of toast from sonner BUT for the server.
 * (see sonner component : src/components/ui/sonner.tsx)
 *
 * This methods SHOULD EXCLUSIVELY be used inside :
 * - API Route (route.ts)
 * - Server Side Code
 * - Server Action (Safe-Action)
 * - Server Components
 */
export async function serverToast(
  message: string,
  type: ServerToastEnum = "info",
) {
  const cookieStore = await cookies();
  const id = crypto.randomUUID();
  cookieStore.set(`toast-${id}`, JSON.stringify({ message, type }), {
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });
}
