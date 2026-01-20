"use server";

import { createElement } from "react";
import MarkdownEmail from "@email/markdown.email";
import { adminAction } from "@/lib/actions/safe-actions";
import { sendEmail } from "@/lib/mail/send-email";
import { getFeedbackById } from "@/query/feedback/get-feedback";
import { z } from "zod";

export const ReplyFeedbackSchema = z.object({
  feedbackId: z.string(),
  message: z.string().min(1, "Message is required"),
});

export const replyFeedbackAction = adminAction
  .inputSchema(ReplyFeedbackSchema)
  .action(async ({ parsedInput: { feedbackId, message } }) => {
    const feedback = await getFeedbackById(feedbackId);

    if (!feedback) {
      throw new Error("Feedback not found");
    }

    const recipientEmail = feedback.user?.email ?? feedback.email;

    if (!recipientEmail) {
      throw new Error("No email address found for this feedback");
    }

    await sendEmail({
      to: recipientEmail,
      subject: "Re: Your Feedback",
      html: createElement(MarkdownEmail, {
        markdown: message,
        preview: "Response to your feedback",
      }),
    });

    return { success: true };
  });
