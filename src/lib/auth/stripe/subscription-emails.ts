import type { Subscription } from "@prisma/client";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/mail/send-email";
import { prisma } from "@/lib/prisma";
import InvoiceAvailableEmail from "@email/subscription/invoice-available";
import PaymentFailedEmail from "@email/subscription/payment-failed";
import RenewalSuccessEmail from "@email/subscription/renewal-success";
import SubscriptionCanceledEmail from "@email/subscription/subscription-canceled";
import TrialConvertedEmail from "@email/subscription/trial-converted";
import TrialExpiredEmail from "@email/subscription/trial-expired";
import TrialReminderEmail from "@email/subscription/trial-reminder";
import TrialWelcomeEmail from "@email/subscription/trial-welcome";
import { format } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import {
  getOperationalErrorCode,
  getOperationalSubjectReference,
} from "@/lib/operations/log-identifiers";

type HookCtx = {
  req: Request;
  userId: string;
  stripeCustomerId: string;
  subscriptionId: string;
};

const formatPlanName = (name: string): string => {
  return name.charAt(0).toUpperCase() + name.slice(1);
};

// Format date in both languages
const formatDateBilingual = (date: Date): string => {
  const frDate = format(date, "d MMMM yyyy", { locale: fr });
  const enDate = format(date, "MMMM d, yyyy", { locale: enUS });
  return `${frDate} / ${enDate}`;
};

const assertEmailDelivered = (
  result: Awaited<ReturnType<typeof sendEmail>>,
) => {
  if (!result.error) return;

  const deliveryError = new Error("email_delivery_failed");
  deliveryError.name = "email_delivery_failed";
  throw deliveryError;
};

const subjectReference = (userId: string) => ({
  subjectReference: getOperationalSubjectReference(userId),
});

export const sendTrialWelcomeEmail = async (
  subscription: Subscription,
  ctx: HookCtx,
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
    });

    if (!user?.email) {
      logger.warn("[sendTrialWelcomeEmail] User not found or no email", {
        eventName: "trial_welcome_email_skipped",
        status: "skipped",
        ...subjectReference(ctx.userId),
      });
      return;
    }

    const trialEndDate = subscription.periodEnd
      ? format(subscription.periodEnd, "d MMMM yyyy", { locale: fr })
      : "dans 14 jours";

    const planName = formatPlanName(subscription.plan);

    const result = await sendEmail({
      to: user.email,
      subject: `Bienvenue dans votre essai MoodDay ${planName} ! / Welcome to your MoodDay ${planName} trial!`,
      html: TrialWelcomeEmail({
        userName: user.name || "Utilisateur",
        planName,
        trialEndDate,
      }),
      tracking: {
        template: "trial-welcome",
        userId: ctx.userId,
      },
    });
    assertEmailDelivered(result);

    logger.info("[sendTrialWelcomeEmail] Trial welcome email sent", {
      eventName: "trial_welcome_email_sent",
      status: "succeeded",
      ...subjectReference(ctx.userId),
    });
  } catch (error) {
    logger.error("[sendTrialWelcomeEmail] Failed to send email", {
      eventName: "trial_welcome_email_failed",
      status: "failed",
      errorCode: getOperationalErrorCode(error),
      ...subjectReference(ctx.userId),
    });
  }
};

export const sendTrialReminderEmail = async (
  subscription: Subscription & {
    user: { id: string; email: string; name: string | null };
  },
  daysLeft: number,
) => {
  try {
    if (!subscription.user.email) {
      logger.warn("[sendTrialReminderEmail] User has no email", {
        eventName: "trial_reminder_email_skipped",
        status: "skipped",
        ...subjectReference(subscription.user.id),
      });
      return false;
    }

    const trialEndDate = subscription.periodEnd
      ? format(subscription.periodEnd, "d MMMM yyyy", { locale: fr })
      : daysLeft === 1
        ? "demain"
        : `dans ${daysLeft} jours`;

    const planName = formatPlanName(subscription.plan);
    const subjectFr =
      daysLeft === 1
        ? "Dernier jour de votre essai MoodDay !"
        : `Votre essai MoodDay expire dans ${daysLeft} jours`;
    const subjectEn =
      daysLeft === 1
        ? "Last day of your MoodDay trial!"
        : `Your MoodDay trial expires in ${daysLeft} days`;

    const result = await sendEmail({
      to: subscription.user.email,
      subject: `${subjectFr} / ${subjectEn}`,
      html: TrialReminderEmail({
        userName: subscription.user.name ?? "Utilisateur",
        daysLeft,
        planName,
        trialEndDate,
      }),
      tracking: {
        template: "trial-reminder",
        userId: subscription.user.id,
      },
    });
    assertEmailDelivered(result);

    logger.info("[sendTrialReminderEmail] Trial reminder email sent", {
      eventName: "trial_reminder_email_sent",
      status: "succeeded",
      ...subjectReference(subscription.user.id),
    });
    return true;
  } catch (error) {
    logger.error("[sendTrialReminderEmail] Failed to send email", {
      eventName: "trial_reminder_email_failed",
      status: "failed",
      errorCode: getOperationalErrorCode(error),
      ...subjectReference(subscription.user.id),
    });
    throw error;
  }
};

export const sendTrialConvertedEmail = async (
  data: { subscription: Subscription },
  ctx: HookCtx,
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
    });

    if (!user?.email) {
      logger.warn("[sendTrialConvertedEmail] User not found or no email", {
        eventName: "trial_converted_email_skipped",
        status: "skipped",
        ...subjectReference(ctx.userId),
      });
      return;
    }

    const planName = formatPlanName(data.subscription.plan);

    const result = await sendEmail({
      to: user.email,
      subject: `Votre abonnement MoodDay ${planName} est actif ! / Your MoodDay ${planName} subscription is active!`,
      html: TrialConvertedEmail({
        userName: user.name || "Utilisateur",
        planName,
      }),
      tracking: {
        template: "trial-converted",
        userId: ctx.userId,
      },
    });
    assertEmailDelivered(result);

    logger.info("[sendTrialConvertedEmail] Trial converted email sent", {
      eventName: "trial_converted_email_sent",
      status: "succeeded",
      ...subjectReference(ctx.userId),
    });
  } catch (error) {
    logger.error("[sendTrialConvertedEmail] Failed to send email", {
      eventName: "trial_converted_email_failed",
      status: "failed",
      errorCode: getOperationalErrorCode(error),
      ...subjectReference(ctx.userId),
    });
  }
};

export const sendTrialExpiredEmail = async (
  subscription: Subscription,
  ctx: HookCtx,
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
    });

    if (!user?.email) {
      logger.warn("[sendTrialExpiredEmail] User not found or no email", {
        eventName: "trial_expired_email_skipped",
        status: "skipped",
        ...subjectReference(ctx.userId),
      });
      return;
    }

    const planName = formatPlanName(subscription.plan);

    const result = await sendEmail({
      to: user.email,
      subject: `Votre essai MoodDay a expiré / Your MoodDay trial has expired`,
      html: TrialExpiredEmail({
        userName: user.name || "Utilisateur",
        planName,
      }),
      tracking: {
        template: "trial-expired",
        userId: ctx.userId,
      },
    });
    assertEmailDelivered(result);

    logger.info("[sendTrialExpiredEmail] Trial expired email sent", {
      eventName: "trial_expired_email_sent",
      status: "succeeded",
      ...subjectReference(ctx.userId),
    });
  } catch (error) {
    logger.error("[sendTrialExpiredEmail] Failed to send email", {
      eventName: "trial_expired_email_failed",
      status: "failed",
      errorCode: getOperationalErrorCode(error),
      ...subjectReference(ctx.userId),
    });
  }
};

export const sendSubscriptionCanceledEmail = async (
  subscription: Subscription,
  ctx: HookCtx,
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
    });

    if (!user?.email) {
      logger.warn(
        "[sendSubscriptionCanceledEmail] User not found or no email",
        {
          eventName: "subscription_canceled_email_skipped",
          status: "skipped",
          ...subjectReference(ctx.userId),
        },
      );
      return;
    }

    const planName = formatPlanName(subscription.plan);
    const endDate = subscription.periodEnd
      ? formatDateBilingual(subscription.periodEnd)
      : "bientôt / soon";

    const result = await sendEmail({
      to: user.email,
      subject: `Votre abonnement MoodDay a été annulé / Your MoodDay subscription has been canceled`,
      html: SubscriptionCanceledEmail({
        userName: user.name || "Utilisateur",
        planName,
        endDate,
      }),
      tracking: {
        template: "subscription-canceled",
        userId: ctx.userId,
      },
    });
    assertEmailDelivered(result);

    logger.info(
      "[sendSubscriptionCanceledEmail] Subscription canceled email sent",
      {
        eventName: "subscription_canceled_email_sent",
        status: "succeeded",
        ...subjectReference(ctx.userId),
      },
    );
  } catch (error) {
    logger.error("[sendSubscriptionCanceledEmail] Failed to send email", {
      eventName: "subscription_canceled_email_failed",
      status: "failed",
      errorCode: getOperationalErrorCode(error),
      ...subjectReference(ctx.userId),
    });
  }
};

export const sendPaymentFailedEmail = async (
  userId: string,
  planName: string,
  retryDate?: Date,
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.email) {
      logger.warn("[sendPaymentFailedEmail] User not found or no email", {
        eventName: "payment_failed_email_skipped",
        status: "skipped",
        ...subjectReference(userId),
      });
      return;
    }

    const formattedRetryDate = retryDate
      ? formatDateBilingual(retryDate)
      : undefined;

    const result = await sendEmail({
      to: user.email,
      subject: `Échec de paiement MoodDay / MoodDay payment failed`,
      html: PaymentFailedEmail({
        userName: user.name || "Utilisateur",
        planName: formatPlanName(planName),
        retryDate: formattedRetryDate,
      }),
      tracking: {
        template: "payment-failed",
        userId,
      },
    });
    assertEmailDelivered(result);

    logger.info("[sendPaymentFailedEmail] Payment failed email sent", {
      eventName: "payment_failed_email_sent",
      status: "succeeded",
      ...subjectReference(userId),
    });
  } catch (error) {
    logger.error("[sendPaymentFailedEmail] Failed to send email", {
      eventName: "payment_failed_email_failed",
      status: "failed",
      errorCode: getOperationalErrorCode(error),
      ...subjectReference(userId),
    });
  }
};

export const sendRenewalSuccessEmail = async (
  userId: string,
  planName: string,
  amount: string,
  nextBillingDate: Date,
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.email) {
      logger.warn("[sendRenewalSuccessEmail] User not found or no email", {
        eventName: "renewal_success_email_skipped",
        status: "skipped",
        ...subjectReference(userId),
      });
      return;
    }

    const formattedNextDate = formatDateBilingual(nextBillingDate);

    const result = await sendEmail({
      to: user.email,
      subject: `Renouvellement MoodDay confirmé / MoodDay renewal confirmed`,
      html: RenewalSuccessEmail({
        userName: user.name || "Utilisateur",
        planName: formatPlanName(planName),
        amount,
        nextBillingDate: formattedNextDate,
      }),
      tracking: {
        template: "renewal-success",
        userId,
      },
    });
    assertEmailDelivered(result);

    logger.info("[sendRenewalSuccessEmail] Renewal success email sent", {
      eventName: "renewal_success_email_sent",
      status: "succeeded",
      ...subjectReference(userId),
    });
  } catch (error) {
    logger.error("[sendRenewalSuccessEmail] Failed to send email", {
      eventName: "renewal_success_email_failed",
      status: "failed",
      errorCode: getOperationalErrorCode(error),
      ...subjectReference(userId),
    });
  }
};

export const sendInvoiceAvailableEmail = async (
  userId: string,
  invoiceNumber: string,
  amount: string,
  invoiceDate: Date,
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.email) {
      logger.warn("[sendInvoiceAvailableEmail] User not found or no email", {
        eventName: "invoice_available_email_skipped",
        status: "skipped",
        ...subjectReference(userId),
      });
      return;
    }

    const formattedDate = formatDateBilingual(invoiceDate);

    const result = await sendEmail({
      to: user.email,
      subject: `Votre facture MoodDay est disponible / Your MoodDay invoice is available`,
      html: InvoiceAvailableEmail({
        userName: user.name || "Utilisateur",
        invoiceNumber,
        amount,
        invoiceDate: formattedDate,
      }),
      tracking: {
        template: "invoice-available",
        userId,
      },
    });
    assertEmailDelivered(result);

    logger.info("[sendInvoiceAvailableEmail] Invoice available email sent", {
      eventName: "invoice_available_email_sent",
      status: "succeeded",
      ...subjectReference(userId),
    });
  } catch (error) {
    logger.error("[sendInvoiceAvailableEmail] Failed to send email", {
      eventName: "invoice_available_email_failed",
      status: "failed",
      errorCode: getOperationalErrorCode(error),
      ...subjectReference(userId),
    });
  }
};
