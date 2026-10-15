import "server-only";

import { after } from "next/server";

export const scheduleAfterResponse = (callback: () => void | Promise<void>) =>
  after(callback);
