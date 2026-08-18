"use client";

import { useEffect, useState } from "react";

import {
  getActiveOfflineOwner,
  getEncryptedOfflineSnapshot,
} from "@/features/pwa/offline-store";

type Contact = { name: string; detail: string };
type OfflineSafetyPlanSnapshot = {
  warningSigns: string[];
  copingStrategies: string[];
  safePlaces: string[];
  trustedContacts: Contact[];
  professionalContacts: Contact[];
  lastReviewedAt: string | null;
};

export function OfflineSafetyPlan() {
  const [plan, setPlan] = useState<OfflineSafetyPlanSnapshot | null>(null);

  useEffect(() => {
    const load = () => {
      const ownerId = getActiveOfflineOwner();
      if (!ownerId) {
        setPlan(null);
        return;
      }
      void getEncryptedOfflineSnapshot<OfflineSafetyPlanSnapshot>(
        ownerId,
        "safety-plan",
      )
        .then(setPlan)
        .catch(() => setPlan(null));
    };
    load();
    window.addEventListener("moodday:offline-owner-changed", load);
    return () =>
      window.removeEventListener("moodday:offline-owner-changed", load);
  }, []);

  if (!plan) return null;

  const sections = [
    ["Mes signaux personnels", plan.warningSigns],
    ["Stratégies d’apaisement", plan.copingStrategies],
    ["Lieux sûrs", plan.safePlaces],
  ] as const;

  return (
    <section className="mt-6 space-y-4 rounded-2xl border p-5 text-left">
      <h2 className="font-semibold">Mon plan de sécurité personnel</h2>
      <p className="text-muted-foreground text-xs">
        Copie chiffrée enregistrée sur cet appareil pour le compte actif.
      </p>
      {sections.map(([title, items]) =>
        items.length > 0 ? (
          <div key={title}>
            <h3 className="text-sm font-semibold">{title}</h3>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
      {[...plan.trustedContacts, ...plan.professionalContacts].length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold">Mes contacts</h3>
          <ul className="mt-1 space-y-1 text-sm">
            {[...plan.trustedContacts, ...plan.professionalContacts].map(
              (contact) => (
                <li key={`${contact.name}:${contact.detail}`}>
                  <strong>{contact.name}</strong> — {contact.detail}
                </li>
              ),
            )}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
