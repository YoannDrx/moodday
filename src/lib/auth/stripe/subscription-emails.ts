import type { Subscription } from "@/generated/prisma";
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
        userId: ctx.userId,
      });
      return;
    }

    const trialEndDate = subscription.periodEnd
      ? format(subscription.periodEnd, "d MMMM yyyy", { locale: fr })
      : "dans 14 jours";

    const planName = formatPlanName(subscription.plan);

    await sendEmail({
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
        metadata: { plan: subscription.plan },
      },
    });

    logger.info("[sendTrialWelcomeEmail] Trial welcome email sent", {
      userId: ctx.userId,
      plan: subscription.plan,
    });
  } catch (error) {
    logger.error("[sendTrialWelcomeEmail] Failed to send email", {
      error,
      userId: ctx.userId,
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
        userId: subscription.user.id,
      });
      return;
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

    await sendEmail({
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
        metadata: { plan: subscription.plan, daysLeft },
      },
    });

    logger.info("[sendTrialReminderEmail] Trial reminder email sent", {
      userId: subscription.user.id,
      plan: subscription.plan,
      daysLeft,
    });
  } catch (error) {
    logger.error("[sendTrialReminderEmail] Failed to send email", {
      error,
      userId: subscription.user.id,
    });
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
        userId: ctx.userId,
      });
      return;
    }

    const planName = formatPlanName(data.subscription.plan);

    await sendEmail({
      to: user.email,
      subject: `Votre abonnement MoodDay ${planName} est actif ! / Your MoodDay ${planName} subscription is active!`,
      html: TrialConvertedEmail({
        userName: user.name || "Utilisateur",
        planName,
      }),
      tracking: {
        template: "trial-converted",
        userId: ctx.userId,
        metadata: { plan: data.subscription.plan },
      },
    });

    logger.info("[sendTrialConvertedEmail] Trial converted email sent", {
      userId: ctx.userId,
      plan: data.subscription.plan,
    });
  } catch (error) {
    logger.error("[sendTrialConvertedEmail] Failed to send email", {
      error,
      userId: ctx.userId,
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
        userId: ctx.userId,
      });
      return;
    }

    const planName = formatPlanName(subscription.plan);

    await sendEmail({
      to: user.email,
      subject: `Votre essai MoodDay a expiré / Your MoodDay trial has expired`,
      html: TrialExpiredEmail({
        userName: user.name || "Utilisateur",
        planName,
      }),
      tracking: {
        template: "trial-expired",
        userId: ctx.userId,
        metadata: { plan: subscription.plan },
      },
    });

    logger.info("[sendTrialExpiredEmail] Trial expired email sent", {
      userId: ctx.userId,
      plan: subscription.plan,
    });
  } catch (error) {
    logger.error("[sendTrialExpiredEmail] Failed to send email", {
      error,
      userId: ctx.userId,
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
          userId: ctx.userId,
        },
      );
      return;
    }

    const planName = formatPlanName(subscription.plan);
    const endDate = subscription.periodEnd
      ? formatDateBilingual(subscription.periodEnd)
      : "bientôt / soon";

    await sendEmail({
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
        metadata: { plan: subscription.plan },
      },
    });

    logger.info(
      "[sendSubscriptionCanceledEmail] Subscription canceled email sent",
      {
        userId: ctx.userId,
        plan: subscription.plan,
      },
    );
  } catch (error) {
    logger.error("[sendSubscriptionCanceledEmail] Failed to send email", {
      error,
      userId: ctx.userId,
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
        userId,
      });
      return;
    }

    const formattedRetryDate = retryDate
      ? formatDateBilingual(retryDate)
      : undefined;

    await sendEmail({
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
        metadata: { planName },
      },
    });

    logger.info("[sendPaymentFailedEmail] Payment failed email sent", {
      userId,
      planName,
    });
  } catch (error) {
    logger.error("[sendPaymentFailedEmail] Failed to send email", {
      error,
      userId,
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
        userId,
      });
      return;
    }

    const formattedNextDate = formatDateBilingual(nextBillingDate);

    await sendEmail({
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
        metadata: { planName, amount },
      },
    });

    logger.info("[sendRenewalSuccessEmail] Renewal success email sent", {
      userId,
      planName,
    });
  } catch (error) {
    logger.error("[sendRenewalSuccessEmail] Failed to send email", {
      error,
      userId,
    });
  }
};

export const sendInvoiceAvailableEmail = async (
  userId: string,
  invoiceNumber: string,
  amount: string,
  invoiceDate: Date,
  invoiceUrl: string,
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.email) {
      logger.warn("[sendInvoiceAvailableEmail] User not found or no email", {
        userId,
      });
      return;
    }

    const formattedDate = formatDateBilingual(invoiceDate);

    await sendEmail({
      to: user.email,
      subject: `Votre facture MoodDay est disponible / Your MoodDay invoice is available`,
      html: InvoiceAvailableEmail({
        userName: user.name || "Utilisateur",
        invoiceNumber,
        amount,
        invoiceDate: formattedDate,
        invoiceUrl,
      }),
      tracking: {
        template: "invoice-available",
        userId,
        metadata: { invoiceNumber, amount },
      },
    });

    logger.info("[sendInvoiceAvailableEmail] Invoice available email sent", {
      userId,
      invoiceNumber,
    });
  } catch (error) {
    logger.error("[sendInvoiceAvailableEmail] Failed to send email", {
      error,
      userId,
    });
  }
};
