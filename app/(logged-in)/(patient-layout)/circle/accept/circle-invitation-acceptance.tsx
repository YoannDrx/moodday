"use client";

import type {
  CircleRelationshipDto,
  SharePermission,
} from "@moodday/contracts";
import { Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

const labels: Record<SharePermission, string> = {
  support_requests: "Recevoir les demandes de soutien explicitement envoyées",
  appointments: "Voir les rendez-vous rendus partageables",
  mood_summary: "Voir les résumés de repères choisis",
  medication_adherence: "Voir une synthèse des prises choisie",
  caregiver_observations: "Ajouter une contribution clairement attribuée",
};

export function CircleInvitationAcceptance({
  invitationToken,
  relationship,
}: {
  invitationToken: string;
  relationship: CircleRelationshipDto;
}) {
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const accept = () => {
    setStatus(undefined);
    startTransition(async () => {
      try {
        const response = await fetch("/api/v2/circle/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitationToken }),
        });
        if (!response.ok) throw new Error("invitation_rejected");
        setAccepted(true);
        setStatus("Invitation acceptée. Le contrat est maintenant actif.");
      } catch {
        setStatus("Cette invitation n’est plus disponible.");
      }
    });
  };

  return (
    <section className="rounded-[28px] border border-[#dde4df] bg-[#fffdf8] p-5 shadow-[0_16px_40px_rgba(24,49,47,0.05)] sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#dcede8] text-[#1e7775]">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-[#18312f]">
            Contrat proposé pour{" "}
            {relationship.displayName ?? relationship.invitationEmail}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#61716f]">
            Il expire le{" "}
            {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
              new Date(relationship.expiresAt),
            )}{" "}
            et peut être révoqué immédiatement.
          </p>
        </div>
      </div>

      <h3 className="mt-6 text-sm font-bold text-[#18312f]">
        Avec ton accord, tu pourras
      </h3>
      <ul className="mt-3 space-y-2">
        {relationship.permissions.map((permission) => (
          <li
            className="flex gap-3 rounded-2xl bg-[#f5f7f4] p-3 text-sm leading-6 text-[#294542]"
            key={permission}
          >
            <Check
              className="mt-1 size-4 shrink-0 text-[#1e7775]"
              aria-hidden="true"
            />
            {labels[permission]}
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-2xl bg-[#f8f1ea] p-4">
        <h3 className="text-sm font-bold text-[#4f4339]">Tu ne pourras pas</h3>
        <p className="mt-1 text-sm leading-6 text-[#5e5145]">
          voir les notes libres ou le plan de sécurité, modifier les données,
          recevoir une alerte automatique, ni accéder à ce qui n’est pas listé
          ci-dessus.
        </p>
      </div>

      {accepted ? (
        <Link
          className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[#1e7775] px-5 text-sm font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-[#166f9e]"
          href="/circle"
        >
          Ouvrir Cercle
        </Link>
      ) : (
        <button
          className="mt-5 min-h-12 w-full rounded-2xl bg-[#1e7775] px-4 text-sm font-bold text-white outline-none hover:bg-[#155c5a] focus-visible:ring-2 focus-visible:ring-[#166f9e] focus-visible:ring-offset-2 disabled:opacity-45"
          disabled={isPending}
          onClick={accept}
          type="button"
        >
          {isPending ? "Acceptation…" : "Accepter ce contrat"}
        </button>
      )}
      <p
        className="mt-4 text-sm font-bold text-[#155c5a]"
        aria-live="polite"
        role="status"
      >
        {status}
      </p>
    </section>
  );
}
