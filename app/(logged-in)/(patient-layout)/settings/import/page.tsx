import { notFound } from "next/navigation";
import { getFeatureAvailability } from "@/lib/features/availability";
import { ImportEditor } from "./import-editor";

export const metadata = { title: "Importer des données" };

export default function ImportPage() {
  if (!getFeatureAvailability("accountImport").enabled) notFound();
  return <ImportEditor />;
}
