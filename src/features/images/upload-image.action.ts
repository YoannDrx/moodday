"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import {
  deleteManagedMooddayBlob,
  vercelBlobAdapter,
} from "@/lib/files/vercel-blob-adapter";
import { replaceUserProfileImage } from "@/features/profile/profile-image";
import { z } from "zod";
import { normalizeAvatar } from "./normalize-avatar";
import { enforceRateLimit } from "@/lib/rate-limit";

export const uploadImageAction = authAction
  .inputSchema(
    z.object({
      formData: z.instanceof(FormData),
    }),
  )
  .action(async ({ parsedInput: { formData }, ctx: { user } }) => {
    const files = formData.get("files") as File | File[];

    let file: File;

    if (Array.isArray(files)) {
      file = files[0];
    } else {
      file = files;
    }

    if (!(file instanceof File)) {
      throw new ActionError("Invalid file (not a file)");
    }

    await enforceRateLimit({
      scope: "avatar-upload",
      identifier: user.id,
      max: 10,
      windowSeconds: 3600,
    });
    const normalized = await normalizeAvatar(file);

    const response = await vercelBlobAdapter.uploadFile({
      file: normalized,
      path: `profile-images/${user.id}`,
    });

    if (response.error) {
      throw new ActionError(response.error.message);
    }

    try {
      await replaceUserProfileImage({
        userId: user.id,
        nextImage: response.data.url,
      });
    } catch (error) {
      await deleteManagedMooddayBlob(response.data.url).catch(() => undefined);
      throw error;
    }

    return response.data.url;
  });
