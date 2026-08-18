"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AUTH_PLANS_DATA } from "@/lib/auth/stripe/auth-plans-data";
import { useI18n } from "@/i18n/provider";
import { PricingCard } from "../plans/pricing-card";
import { closeGlobalDialog } from "./global-dialog.store";

export const UserPlanDialog = () => {
  const { t } = useI18n();

  return (
    <Dialog open={true} onOpenChange={() => closeGlobalDialog()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-auto px-8 py-6 lg:px-16 lg:py-14">
        <DialogHeader className="w-full text-center">
          <DialogTitle className="text-center font-bold lg:text-3xl">
            {t("pricing.dialog.title")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("pricing.dialog.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-8 flex w-full justify-center gap-4 max-md:flex-col lg:mt-12 lg:gap-8 xl:gap-12">
          {AUTH_PLANS_DATA.map((card, i) => (
            <PricingCard key={i} plan={card} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
