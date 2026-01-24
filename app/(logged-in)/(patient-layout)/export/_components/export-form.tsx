"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { pdf } from "@react-pdf/renderer";
import { FileDown, Calendar, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getExportData,
  getExportPreview,
} from "@/features/export/export.action";
import { ExportPDFDocument } from "@/features/export/pdf-document";
import { useI18n } from "@/i18n/provider";

type DatePreset = {
  label: string;
  days: number;
};

export function ExportForm() {
  const { t } = useI18n();

  const presets: DatePreset[] = [
    { label: t("export.presets.twoWeeks"), days: 14 },
    { label: t("export.presets.oneMonth"), days: 30 },
    { label: t("export.presets.threeMonths"), days: 90 },
  ];

  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(
    defaultStart.toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);
  const [showPreview, setShowPreview] = useState(false);

  const isValidRange = useMemo(() => {
    return new Date(startDate) <= new Date(endDate);
  }, [startDate, endDate]);

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: ["export-preview", startDate, endDate],
    queryFn: async () => {
      const result = await getExportPreview({ startDate, endDate });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    enabled: isValidRange,
  });

  const { data: exportData, isLoading: exportLoading } = useQuery({
    queryKey: ["export-data", startDate, endDate, showPreview],
    queryFn: async () => {
      const result = await getExportData({ startDate, endDate });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    enabled: showPreview && isValidRange,
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const result = await getExportData({ startDate, endDate });
      if (result.serverError) throw new Error(result.serverError);
      if (!result.data) throw new Error("No data");

      const blob = await pdf(<ExportPDFDocument data={result.data} />).toBlob();

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `moodday-export-${startDate}-${endDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    },
    onSuccess: () => {
      toast.success(t("export.download.success"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            {t("export.dateRange.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.days}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset.days)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Date inputs */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-date">{t("export.dateRange.start")}</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">{t("export.dateRange.end")}</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={today.toISOString().split("T")[0]}
              />
            </div>
          </div>

          {/* Preview counts */}
          {!isValidRange && (
            <p className="text-destructive text-sm">
              {t("export.dateRange.invalidRange")}
            </p>
          )}

          {isValidRange && preview && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {t("export.preview.moodEntries", {
                  count: preview.moodEntries,
                })}
              </Badge>
              <Badge variant="secondary">
                {t("export.preview.therapySessions", {
                  count: preview.therapySessions,
                })}
              </Badge>
              <Badge variant="secondary">
                {t("export.preview.exerciseLogs", {
                  count: preview.exerciseLogs,
                })}
              </Badge>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={!isValidRange || previewLoading}
            >
              <Eye className="mr-2 size-4" />
              {t("export.actions.preview")}
            </Button>
            <Button
              onClick={() => downloadMutation.mutate()}
              disabled={
                !isValidRange ||
                downloadMutation.isPending ||
                (preview?.total ?? 0) === 0
              }
            >
              {downloadMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 size-4" />
              )}
              {t("export.actions.download")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("export.preview.title")}</DialogTitle>
          </DialogHeader>

          {exportLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin" />
            </div>
          ) : exportData ? (
            <div className="space-y-6">
              {/* Summary */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {exportData.mood.stats.count}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {t("export.preview.moodEntries", {
                          count: exportData.mood.stats.count,
                        })}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {exportData.mood.stats.average ?? "-"}/10
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {t("export.preview.averageMood")}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {exportData.medications.adherencePercent ?? "-"}%
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {t("export.preview.adherence")}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {exportData.therapy.count}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {t("export.preview.therapySessions", {
                          count: exportData.therapy.count,
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medications list */}
              {exportData.medications.list.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold">
                    {t("export.preview.medications")}
                  </h3>
                  <div className="space-y-2">
                    {exportData.medications.list.map((med, i) => (
                      <div
                        key={i}
                        className="bg-muted/50 rounded-lg p-3 text-sm"
                      >
                        <span className="font-medium">{med.name}</span> -{" "}
                        {med.dosage}
                        <span className="text-muted-foreground ml-2">
                          ({med.intakesCount} prises)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  {t("export.actions.modifyPeriod")}
                </Button>
                <Button
                  onClick={() => {
                    downloadMutation.mutate();
                    setShowPreview(false);
                  }}
                  disabled={downloadMutation.isPending}
                >
                  {downloadMutation.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 size-4" />
                  )}
                  {t("export.actions.download")}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
