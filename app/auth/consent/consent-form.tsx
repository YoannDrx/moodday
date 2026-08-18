"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/provider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { acceptRequiredConsents } from "./consent.action";

export function ConsentForm() {
  const { locale } = useI18n();
  const router = useRouter();
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [healthData, setHealthData] = useState(false);
  const { execute, isPending } = useAction(acceptRequiredConsents, {
    onSuccess: () => {
      router.replace("/dashboard");
      router.refresh();
    },
    onError: () =>
      toast.error(
        locale === "en" ? "Unable to save" : "Enregistrement impossible",
      ),
  });
  const isEnglish = locale === "en";

  return (
    <div className="space-y-5">
      <ConsentRow id="consent-age" checked={age} onCheckedChange={setAge}>
        {isEnglish
          ? "I confirm that I am at least 18 years old."
          : "Je confirme avoir au moins 18 ans."}
      </ConsentRow>
      <ConsentRow id="consent-terms" checked={terms} onCheckedChange={setTerms}>
        {isEnglish ? "I accept the current " : "J’accepte les "}
        <Link className="underline" href="/legal/terms" target="_blank">
          {isEnglish ? "terms" : "conditions d’utilisation"}
        </Link>
        .
      </ConsentRow>
      <ConsentRow
        id="consent-privacy"
        checked={privacy}
        onCheckedChange={setPrivacy}
      >
        {isEnglish ? "I accept the current " : "J’accepte la "}
        <Link className="underline" href="/legal/privacy" target="_blank">
          {isEnglish ? "privacy policy" : "politique de confidentialité"}
        </Link>
        .
      </ConsentRow>
      <ConsentRow
        id="consent-health-data"
        checked={healthData}
        onCheckedChange={setHealthData}
      >
        {isEnglish
          ? "I explicitly consent to Moodday processing my mood, therapy, and medication data solely to provide my personal journal. This service cannot operate without that processing."
          : "Je consens explicitement à ce que Moodday traite mes données d’humeur, de thérapie et de traitement uniquement pour fournir mon journal personnel. Le service ne peut pas fonctionner sans ce traitement."}
      </ConsentRow>
      <Button
        className="w-full"
        disabled={!age || !terms || !privacy || !healthData || isPending}
        onClick={() =>
          execute({
            age18Accepted: true,
            termsAccepted: true,
            privacyAccepted: true,
            healthDataConsentAccepted: true,
            locale,
          })
        }
      >
        {isEnglish ? "Accept and continue" : "Accepter et continuer"}
      </Button>
    </div>
  );
}

function ConsentRow({
  id,
  checked,
  onCheckedChange,
  children,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <Label htmlFor={id} className="leading-6">
        {children}
      </Label>
    </div>
  );
}
