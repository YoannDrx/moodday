import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { appBaseUrl } from "./api";
import { authClient } from "./auth-client";

export class MobileAccountDataError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "MobileAccountDataError";
  }
}

export const exportAndShareAccountData = async () => {
  const response = await fetch(`${appBaseUrl}/api/export/json`, {
    headers: {
      Accept: "application/json",
      Cookie: await authClient.getCookie(),
    },
  });
  if (response.status === 401) {
    throw new MobileAccountDataError("authentication_required");
  }
  if (response.status === 403) {
    throw new MobileAccountDataError("recent_authentication_required");
  }
  if (!response.ok) throw new MobileAccountDataError("export_failed");
  if (!(await Sharing.isAvailableAsync())) {
    throw new MobileAccountDataError("sharing_unavailable");
  }

  const date = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `moodday-export-${date}.json`);
  if (file.exists) file.delete();
  file.write(await response.text());
  try {
    await Sharing.shareAsync(file.uri, {
      UTI: "public.json",
      mimeType: "application/json",
      dialogTitle: "Exporter mes données Mood Day",
    });
  } finally {
    if (file.exists) file.delete();
  }
};
