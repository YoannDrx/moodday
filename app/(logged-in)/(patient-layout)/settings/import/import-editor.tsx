"use client";

import { useState } from "react";
import { toast } from "sonner";

import { PageLayout } from "@/components/nowts/page-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  commitMooddayImport,
  previewMooddayImport,
} from "@/features/import/import.action";
import { useI18n } from "@/i18n/provider";

type Preview = {
  digest: string;
  validRows: number;
  duplicateRows: number;
  errors: { rowNumber: number; code: string }[];
  sample: { rowNumber: number; date: string; value: number; tags: string[] }[];
};

export function ImportEditor() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [content, setContent] = useState("");
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [pending, setPending] = useState(false);

  const selectFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 1_000_000) {
      toast.error(fr ? "Le fichier dépasse 1 Mo" : "File exceeds 1 MB");
      return;
    }
    setFormat(file.name.toLowerCase().endsWith(".csv") ? "csv" : "json");
    setContent(await file.text());
    setPreview(null);
  };

  const runPreview = async () => {
    setPending(true);
    const result = await previewMooddayImport({ format, content });
    setPending(false);
    if (result.serverError || !result.data) {
      toast.error(result.serverError ?? "Invalid import");
      return;
    }
    setPreview(result.data);
  };

  const commit = async () => {
    if (!preview) return;
    setPending(true);
    const result = await commitMooddayImport({
      format,
      content,
      expectedDigest: preview.digest,
    });
    setPending(false);
    if (result.serverError || !result.data) {
      toast.error(result.serverError ?? "Import failed");
      return;
    }
    toast.success(
      fr
        ? `${result.data.importedRows} ligne(s) importée(s)`
        : `${result.data.importedRows} row(s) imported`,
    );
    setContent("");
    setPreview(null);
  };

  return (
    <PageLayout
      title={fr ? "Importer des données" : "Import data"}
      subtitle={
        fr
          ? "Aucune écriture n’a lieu avant votre validation explicite."
          : "Nothing is written until you explicitly confirm."
      }
      maxWidth="3xl"
    >
      <div className="space-y-6">
        <div className="space-y-2 rounded-xl border p-5">
          <Label htmlFor="import-file">JSON Moodday v2 ou CSV</Label>
          <Input
            id="import-file"
            type="file"
            accept=".json,.csv,application/json,text/csv"
            onChange={(event) => void selectFile(event.target.files?.[0])}
          />
          <p className="text-muted-foreground text-xs">
            CSV : colonnes date, value, note, energy, anxiety, tags. Les tags
            sont séparés par |.
          </p>
          <Button
            disabled={pending || content.length === 0}
            onClick={() => void runPreview()}
          >
            {fr ? "Prévisualiser" : "Preview"}
          </Button>
        </div>
        {preview ? (
          <section
            aria-labelledby="import-preview"
            className="space-y-4 rounded-xl border p-5"
          >
            <h2 id="import-preview" className="font-semibold">
              {fr ? "Prévisualisation" : "Preview"}
            </h2>
            <p className="text-sm">
              {preview.validRows} {fr ? "ligne(s) valide(s)" : "valid row(s)"} ·{" "}
              {preview.duplicateRows} {fr ? "doublon(s)" : "duplicate(s)"}
            </p>
            {preview.errors.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-red-700">
                {preview.errors.map((error) => (
                  <li key={`${error.rowNumber}:${error.code}`}>
                    Ligne {error.rowNumber} : {error.code}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Humeur</th>
                    <th className="p-2">Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.sample.map((row) => (
                    <tr key={row.rowNumber} className="border-t">
                      <td className="p-2">{row.rowNumber}</td>
                      <td className="p-2">{row.date}</td>
                      <td className="p-2">{row.value}</td>
                      <td className="p-2">{row.tags.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              disabled={pending || preview.errors.length > 0}
              onClick={() => void commit()}
            >
              {fr ? "Confirmer l’import" : "Confirm import"}
            </Button>
          </section>
        ) : null}
      </div>
    </PageLayout>
  );
}
