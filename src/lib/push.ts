import webPush from "web-push";

import { env } from "@/lib/env";

let configured = false;

export const getWebPush = () => {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return null;

  if (!configured) {
    const subject = env.VAPID_SUBJECT ?? "mailto:admin@example.com";
    webPush.setVapidDetails(
      subject,
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY,
    );
    configured = true;
  }

  return webPush;
};

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
};

export const buildPushPayload = (payload: PushPayload) =>
  JSON.stringify(payload);
