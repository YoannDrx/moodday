"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/provider";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { replyFeedbackAction } from "../_actions/reply-feedback.action";

type FeedbackReplyButtonProps = {
  feedbackId: string;
  recipientName: string;
};

export function FeedbackReplyButton({
  feedbackId,
  recipientName,
}: FeedbackReplyButtonProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      await resolveActionResult(
        replyFeedbackAction({
          feedbackId,
          message,
        }),
      );
      toast.success(t("admin.feedback.reply.sent"));
      setOpen(false);
      setMessage("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("admin.feedback.reply.failed"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Mail className="size-4" />
          {t("admin.feedback.reply.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("admin.feedback.reply.title")}</DialogTitle>
          <DialogDescription>
            {t("admin.feedback.reply.description", { name: recipientName })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="message">{t("admin.feedback.reply.message")}</Label>
            <Textarea
              id="message"
              placeholder={t("admin.feedback.reply.placeholder")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("actions.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !message.trim()}
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            {t("admin.feedback.reply.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
