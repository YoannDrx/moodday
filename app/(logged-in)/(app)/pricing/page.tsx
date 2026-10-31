import { getDuoEntitlement } from "@/features/couple/entitlement.service";
import { DuoOffer } from "@/features/plans/duo-offer";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { getFeatureAvailability } from "@/lib/features/availability";
import { getUserActiveSubscription } from "@/lib/user/get-user-subscription";
import { UserBilling } from "@app/(logged-in)/(account-layout)/account/billing/user-billing";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Abonnement Duo" };

export default async function PricingPage() {
  const user = await getRequiredUser();
  const [subscription, entitlement] = await Promise.all([
    getUserActiveSubscription(),
    getDuoEntitlement(user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-4xl font-extrabold sm:text-5xl">Abonnement Duo</h1>
        <p className="text-muted-foreground mt-1 font-semibold">
          Le partage de base, la crise et tes données ne seront jamais payants.
        </p>
      </header>
      {subscription && <UserBilling subscription={subscription} />}
      <DuoOffer
        billingEnabled={getFeatureAvailability("billing").enabled}
        active={entitlement.active}
      />
    </div>
  );
}
