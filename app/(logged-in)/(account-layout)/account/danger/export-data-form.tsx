"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingButton } from "@/features/form/submit-button";
import { useI18n } from "@/i18n/provider";
import { exportUserData } from "@/features/account/export-data.action";
import { useMutation } from "@tanstack/react-query";
import { Download, FileJson } from "lucide-react";
import { toast } from "sonner";

export function ExportDataForm() {
  const { t } = useI18n();

  const exportMutation = useMutation({
    mutationFn: async () => {
      const result = await exportUserData();
      if (result.data) {
        return result.data;
      }
      throw new Error("Export failed");
    },
    onSuccess: (data) => {
      // Create and download JSON file
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `moodday-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t("account.export.success"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileJson className="text-primary size-5" />
          <CardTitle className="text-xl font-semibold">
            {t("account.export.title")}
          </CardTitle>
        </div>
        <CardDescription className="text-muted-foreground text-base">
          {t("account.export.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-start gap-4">
            <Download className="text-muted-foreground mt-0.5 size-5" />
            <div className="space-y-1">
              <p className="leading-none font-medium">
                {t("account.export.dataIncludedTitle")}
              </p>
              <p className="text-muted-foreground text-sm">
                {t("account.export.dataIncludedDescription")}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-4">
        <LoadingButton
          variant="outline"
          size="lg"
          loading={exportMutation.isPending}
          onClick={() => exportMutation.mutate()}
        >
          <Download className="mr-2 size-4" />
          {t("account.export.button")}
        </LoadingButton>
      </CardFooter>
    </Card>
  );
}
