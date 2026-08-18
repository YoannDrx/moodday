"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HeartHandshake } from "lucide-react";

import { PageLayout } from "@/components/nowts/page-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/provider";
import { saveSafetyPlan } from "@/features/safety-plan/safety-plan.action";
import type { SafetyPlan } from "@prisma/client";
import { saveEncryptedOfflineSnapshot } from "@/features/pwa/offline-store";

type Contact = { name: string; detail: string };

const listToText = (value: string[] | undefined) => (value ?? []).join("\n");
const textToList = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
const contactsToText = (value: unknown) =>
  Array.isArray(value)
    ? (value as Contact[])
        .map((contact) => `${contact.name} — ${contact.detail}`)
        .join("\n")
    : "";
const textToContacts = (value: string) =>
  value
    .split("\n")
    .map((line) => line.split(/\s+[—-]\s+/, 2).map((item) => item.trim()))
    .filter((parts) => parts.length === 2 && parts.every(Boolean))
    .slice(0, 10)
    .map(([name, detail]) => ({ name, detail }));

export function SafetyPlanEditor({
  initialPlan,
  ownerId,
}: {
  initialPlan: SafetyPlan | null;
  ownerId: string;
}) {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [warningSigns, setWarningSigns] = useState(
    listToText(initialPlan?.warningSigns),
  );
  const [copingStrategies, setCopingStrategies] = useState(
    listToText(initialPlan?.copingStrategies),
  );
  const [safePlaces, setSafePlaces] = useState(
    listToText(initialPlan?.safePlaces),
  );
  const [trustedContacts, setTrustedContacts] = useState(
    contactsToText(initialPlan?.trustedContacts),
  );
  const [professionalContacts, setProfessionalContacts] = useState(
    contactsToText(initialPlan?.professionalContacts),
  );
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!initialPlan) return;
    void saveEncryptedOfflineSnapshot(ownerId, "safety-plan", {
      warningSigns: initialPlan.warningSigns,
      copingStrategies: initialPlan.copingStrategies,
      safePlaces: initialPlan.safePlaces,
      trustedContacts: initialPlan.trustedContacts,
      professionalContacts: initialPlan.professionalContacts,
      lastReviewedAt: initialPlan.lastReviewedAt?.toISOString() ?? null,
    }).catch(() => undefined);
  }, [initialPlan, ownerId]);

  const save = async () => {
    setPending(true);
    const snapshot = {
      warningSigns: textToList(warningSigns),
      copingStrategies: textToList(copingStrategies),
      safePlaces: textToList(safePlaces),
      trustedContacts: textToContacts(trustedContacts),
      professionalContacts: textToContacts(professionalContacts),
    };
    const result = await saveSafetyPlan({
      ...snapshot,
      markReviewed: true,
    });
    if (result.serverError) {
      setPending(false);
      toast.error(result.serverError);
      return;
    }
    await saveEncryptedOfflineSnapshot(ownerId, "safety-plan", {
      ...snapshot,
      lastReviewedAt: new Date().toISOString(),
    }).catch(() => undefined);
    setPending(false);
    toast.success(fr ? "Plan enregistré" : "Safety plan saved");
  };

  const fields = [
    {
      id: "warning-signs",
      label: fr ? "Mes signaux personnels" : "My warning signs",
      value: warningSigns,
      setValue: setWarningSigns,
    },
    {
      id: "coping-strategies",
      label: fr ? "Stratégies qui peuvent m’apaiser" : "Coping strategies",
      value: copingStrategies,
      setValue: setCopingStrategies,
    },
    {
      id: "safe-places",
      label: fr
        ? "Lieux où je me sens en sécurité"
        : "Places where I feel safe",
      value: safePlaces,
      setValue: setSafePlaces,
    },
    {
      id: "trusted-contacts",
      label: fr
        ? "Contacts de confiance (Nom — coordonnées)"
        : "Trusted contacts (Name — details)",
      value: trustedContacts,
      setValue: setTrustedContacts,
    },
    {
      id: "professional-contacts",
      label: fr
        ? "Contacts professionnels (Nom — coordonnées)"
        : "Professional contacts (Name — details)",
      value: professionalContacts,
      setValue: setProfessionalContacts,
    },
  ];

  return (
    <PageLayout
      title={fr ? "Plan de sécurité personnel" : "Personal safety plan"}
      subtitle={
        fr
          ? "Un document facultatif que vous remplissez vous-même. Moodday ne contacte personne automatiquement."
          : "An optional document you complete yourself. Moodday never contacts anyone automatically."
      }
      maxWidth="3xl"
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <HeartHandshake className="size-5" />
            {fr
              ? "Moodday n’est pas un service d’urgence"
              : "Moodday is not an emergency service"}
          </div>
          <p className="text-sm">
            {fr
              ? "En France : prévention du suicide 3114, SAMU 15, urgences européennes 112."
              : "In France: suicide prevention 3114, emergency medical service 15, European emergency number 112."}
          </p>
        </div>
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            <Textarea
              id={field.id}
              rows={5}
              maxLength={10_000}
              value={field.value}
              onChange={(event) => field.setValue(event.target.value)}
              placeholder={fr ? "Un élément par ligne" : "One item per line"}
            />
          </div>
        ))}
        <Button disabled={pending} onClick={() => void save()}>
          {pending
            ? fr
              ? "Enregistrement…"
              : "Saving…"
            : fr
              ? "Enregistrer et marquer comme revu"
              : "Save and mark as reviewed"}
        </Button>
      </div>
    </PageLayout>
  );
}
