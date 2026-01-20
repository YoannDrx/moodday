import type { PageParams } from "@/types/next";
import type { Metadata, ResolvingMetadata } from "next";

/**
 * Add a suffix to the title of the parent metadata
 *
 * If a layout in /users/ define the title as "Users", the title will be append to the title as "Users · My suffix"
 *
 * @param metadataOrFn The metadata object or an async function that returns metadata
 * @returns
 */
export const combineWithParentMetadata =
  (metadataOrFn: Metadata | (() => Metadata) | (() => Promise<Metadata>)) =>
  async (_: PageParams, parent: ResolvingMetadata): Promise<Metadata> => {
    const metadata =
      typeof metadataOrFn === "function" ? await metadataOrFn() : metadataOrFn;
    const parentMetadata = await parent;
    return {
      ...metadata,
      title: `${parentMetadata.title?.absolute} · ${metadata.title}`,
    };
  };
