import { RegulatoryExportDownload } from "./download-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Export réglementaire | Moodday",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function RegulatoryExportPage({
  params,
}: {
  params: Promise<{ requestReference: string }>;
}) {
  const { requestReference } = await params;
  return <RegulatoryExportDownload requestReference={requestReference} />;
}
