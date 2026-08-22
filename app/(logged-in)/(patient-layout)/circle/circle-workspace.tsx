"use client";

import type {
  CircleInvitationResult,
  CircleRelationshipDto,
  SharePermission,
  SupportRequestDto,
  SupportRequestKind,
} from "@moodday/contracts";
import {
  Clock3,
  Copy,
  HeartHandshake,
  MailPlus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useState, useTransition } from "react";

const permissionOptions: {
  value: SharePermission;
  label: string;
  description: string;
}[] = [
  {
    value: "support_requests",
    label: "Demandes de soutien",
    description: "Recevoir uniquement les demandes que tu envoies.",
  },
  {
    value: "appointments",
    label: "Rendez-vous",
    description: "Voir les rendez-vous que tu rends partageables.",
  },
  {
    value: "mood_summary",
    label: "Résumé de repères",
    description: "Voir un résumé choisi, jamais les notes libres.",
  },
  {
    value: "medication_adherence",
    label: "Suivi des prises",
    description: "Voir une synthèse d’adhérence, sans recommandations.",
  },
  {
    value: "caregiver_observations",
    label: "Contributions",
    description: "Ajouter une observation clairement attribuée.",
  },
];

const supportKinds: { value: SupportRequestKind; label: string }[] = [
  { value: "call", label: "Un appel" },
  { value: "presence", label: "Une présence" },
  { value: "walk", label: "Une promenade" },
  { value: "meal", label: "Un repas" },
  { value: "transport", label: "Un accompagnement" },
  { value: "other", label: "Autre chose" },
];

type ApiResult<T> = { data: T } | { error: { message: string } };

const request = async <T,>(path: string, init?: RequestInit) => {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await response.json()) as ApiResult<T>;
  if (!response.ok || !("data" in body)) {
    throw new Error(
      "error" in body ? body.error.message : "unexpected_response",
    );
  }
  return body.data;
};

export function CircleWorkspace({
  currentUserId,
  enabled,
  initialRelationships,
  initialSupportRequests,
}: {
  currentUserId: string;
  enabled: boolean;
  initialRelationships: CircleRelationshipDto[];
  initialSupportRequests: SupportRequestDto[];
}) {
  const [relationships, setRelationships] = useState(initialRelationships);
  const [supportRequests, setSupportRequests] = useState(
    initialSupportRequests,
  );
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [permissions, setPermissions] = useState<SharePermission[]>([
    "support_requests",
  ]);
  const [invitationUrl, setInvitationUrl] = useState<string>();
  const [relationshipId, setRelationshipId] = useState("");
  const [supportKind, setSupportKind] = useState<SupportRequestKind>("call");
  const [supportMessage, setSupportMessage] = useState("");
  const [status, setStatus] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const activeRelationships = relationships.filter(
    (item) =>
      item.status === "active" && item.permissions.includes("support_requests"),
  );

  const togglePermission = (permission: SharePermission) => {
    setPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  };

  const invite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(undefined);
    setInvitationUrl(undefined);
    startTransition(async () => {
      try {
        const result = await request<CircleInvitationResult>("/api/v2/circle", {
          method: "POST",
          body: JSON.stringify({
            operationId: `operation-${crypto.randomUUID()}`,
            relationshipId: `relationship-${crypto.randomUUID()}`,
            invitationEmail: email,
            displayName: displayName.trim() || null,
            permissions,
            durationDays,
          }),
        });
        setRelationships((current) => [result.relationship, ...current]);
        setInvitationUrl(
          `${window.location.origin}/circle/accept?token=${encodeURIComponent(result.invitationToken)}`,
        );
        setEmail("");
        setDisplayName("");
        setStatus(
          "Invitation créée. Partage le lien avec la personne choisie.",
        );
      } catch {
        setStatus("Impossible de créer l’invitation pour le moment.");
      }
    });
  };

  const revoke = (id: string) => {
    setStatus(undefined);
    startTransition(async () => {
      try {
        await request<{ revoked: boolean }>(
          `/api/v2/circle/${encodeURIComponent(id)}`,
          { method: "DELETE" },
        );
        setRelationships((current) =>
          current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "revoked",
                  revokedAt: new Date().toISOString(),
                }
              : item,
          ),
        );
        setStatus("Accès révoqué. Il sera refusé dès la prochaine requête.");
      } catch {
        setStatus("La révocation n’a pas abouti. Réessaie.");
      }
    });
  };

  const askForSupport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!relationshipId) return;
    setStatus(undefined);
    startTransition(async () => {
      try {
        const result = await request<SupportRequestDto>(
          "/api/v2/support-requests",
          {
            method: "POST",
            body: JSON.stringify({
              operationId: `operation-${crypto.randomUUID()}`,
              relationshipId,
              kind: supportKind,
              message: supportMessage.trim() || null,
              requestedFor: null,
            }),
          },
        );
        setSupportRequests((current) => [result, ...current]);
        setSupportMessage("");
        setStatus("Demande créée. Aucune autre information n’a été envoyée.");
      } catch {
        setStatus("Cette demande ne peut pas être envoyée pour le moment.");
      }
    });
  };

  const respond = (id: string, responseStatus: "accepted" | "declined") => {
    setStatus(undefined);
    startTransition(async () => {
      try {
        const result = await request<SupportRequestDto>(
          `/api/v2/support-requests/${encodeURIComponent(id)}`,
          { method: "PATCH", body: JSON.stringify({ status: responseStatus }) },
        );
        setSupportRequests((current) =>
          current.map((item) => (item.id === result.id ? result : item)),
        );
        setStatus(
          responseStatus === "accepted"
            ? "Réponse envoyée : demande acceptée."
            : "Réponse envoyée : demande déclinée.",
        );
      } catch {
        setStatus("Cette réponse n’a pas pu être enregistrée.");
      }
    });
  };

  if (!enabled) {
    return (
      <section className="rounded-[28px] border border-[#e2d3c5] bg-[#fff8f1] p-6">
        <h2 className="text-xl font-bold text-[#18312f]">
          Cercle est en préparation sur cet environnement
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61716f]">
          Aucune invitation ni donnée n’est créée tant que le gate de partage
          aidant n’est pas activé.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel
        icon={<MailPlus className="size-5" aria-hidden="true" />}
        eyebrow="Inviter"
        title="Un contrat lisible avant d’accepter"
      >
        <form className="space-y-4" onSubmit={invite}>
          <Field label="Adresse e-mail" htmlFor="circle-email">
            <input
              id="circle-email"
              className="input-carnet"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </Field>
          <Field label="Prénom ou repère (facultatif)" htmlFor="circle-name">
            <input
              id="circle-name"
              className="input-carnet"
              maxLength={100}
              onChange={(event) => setDisplayName(event.target.value)}
              value={displayName}
            />
          </Field>
          <fieldset className="space-y-2">
            <legend className="text-sm font-bold text-[#18312f]">
              Ce que cette personne pourra faire ou voir
            </legend>
            {permissionOptions.map((option) => (
              <label
                className="flex min-h-14 cursor-pointer gap-3 rounded-2xl bg-[#f5f7f4] p-3"
                key={option.value}
              >
                <input
                  checked={permissions.includes(option.value)}
                  className="mt-1 size-5 shrink-0 accent-[#1e7775]"
                  onChange={() => togglePermission(option.value)}
                  type="checkbox"
                />
                <span>
                  <span className="block text-sm font-bold text-[#18312f]">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-[#61716f]">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          <Field label="Durée" htmlFor="circle-duration">
            <select
              id="circle-duration"
              className="input-carnet"
              onChange={(event) => setDurationDays(Number(event.target.value))}
              value={durationDays}
            >
              <option value={7}>7 jours</option>
              <option value={30}>30 jours</option>
              <option value={90}>90 jours</option>
              <option value={365}>1 an</option>
            </select>
          </Field>
          <p className="rounded-2xl bg-[#f8f1ea] p-3 text-xs leading-5 text-[#5e5145]">
            Jamais partagé : notes libres, plan de sécurité, données non
            sélectionnées, diagnostic supposé ou alerte automatique.
          </p>
          <ActionButton disabled={permissions.length === 0 || isPending}>
            Créer l’invitation
          </ActionButton>
        </form>
        {invitationUrl ? (
          <div className="mt-4 rounded-2xl border border-[#afc9bc] bg-[#eef5f2] p-4">
            <p className="text-sm font-bold text-[#18312f]">Lien à partager</p>
            <p className="mt-1 text-xs leading-5 break-all text-[#526765]">
              {invitationUrl}
            </p>
            <button
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[#155c5a] outline-none focus-visible:ring-2 focus-visible:ring-[#166f9e]"
              onClick={() => void navigator.clipboard.writeText(invitationUrl)}
              type="button"
            >
              <Copy className="size-4" aria-hidden="true" />
              Copier le lien
            </button>
          </div>
        ) : null}
      </Panel>

      <Panel
        icon={<ShieldCheck className="size-5" aria-hidden="true" />}
        eyebrow="Contrats"
        title="Qui a accès à quoi"
      >
        <ul className="space-y-3">
          {relationships.length > 0 ? (
            relationships.map((item) => (
              <li
                className="rounded-2xl border border-[#dde4df] p-4"
                key={item.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#18312f]">
                      {item.displayName ?? item.invitationEmail}
                    </p>
                    <p className="mt-1 text-xs text-[#61716f]">
                      {item.status === "active"
                        ? "Actif"
                        : item.status === "invited"
                          ? "Invitation en attente"
                          : item.status === "revoked"
                            ? "Révoqué"
                            : item.status}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-[#61716f]">
                    <Clock3 className="size-3.5" aria-hidden="true" />
                    jusqu’au{" "}
                    {new Intl.DateTimeFormat("fr-FR").format(
                      new Date(item.expiresAt),
                    )}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-[#526765]">
                  {item.permissions
                    .map(
                      (permission) =>
                        permissionOptions.find(
                          (option) => option.value === permission,
                        )?.label ?? permission,
                    )
                    .join(" · ")}
                </p>
                {item.status !== "revoked" ? (
                  <button
                    className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-[#a13f49] outline-none hover:bg-[#f8e5e5] focus-visible:ring-2 focus-visible:ring-[#166f9e]"
                    disabled={isPending}
                    onClick={() => revoke(item.id)}
                    type="button"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Révoquer l’accès
                  </button>
                ) : null}
              </li>
            ))
          ) : (
            <li className="rounded-2xl border border-dashed border-[#cad8d2] p-4 text-sm text-[#61716f]">
              Personne dans ton Cercle pour l’instant.
            </li>
          )}
        </ul>
      </Panel>

      <Panel
        icon={<HeartHandshake className="size-5" aria-hidden="true" />}
        eyebrow="Demander"
        title="Un soutien précis, quand tu le choisis"
      >
        {activeRelationships.length > 0 ? (
          <form className="space-y-4" onSubmit={askForSupport}>
            <Field label="À qui" htmlFor="support-person">
              <select
                id="support-person"
                className="input-carnet"
                onChange={(event) => setRelationshipId(event.target.value)}
                required
                value={relationshipId}
              >
                <option value="">Choisir une personne</option>
                {activeRelationships.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.displayName ?? item.invitationEmail}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Type de soutien" htmlFor="support-kind">
              <select
                id="support-kind"
                className="input-carnet"
                onChange={(event) =>
                  setSupportKind(event.target.value as SupportRequestKind)
                }
                value={supportKind}
              >
                {supportKinds.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Message facultatif" htmlFor="support-message">
              <textarea
                id="support-message"
                className="input-carnet min-h-24 resize-y"
                maxLength={500}
                onChange={(event) => setSupportMessage(event.target.value)}
                value={supportMessage}
              />
            </Field>
            <ActionButton disabled={!relationshipId || isPending}>
              Créer la demande
            </ActionButton>
          </form>
        ) : (
          <p className="rounded-2xl border border-dashed border-[#cad8d2] p-4 text-sm leading-6 text-[#61716f]">
            Une personne doit avoir accepté la permission « demandes de soutien
            » avant de pouvoir recevoir une demande.
          </p>
        )}
      </Panel>

      <Panel
        icon={<Clock3 className="size-5" aria-hidden="true" />}
        eyebrow="Activité"
        title="Demandes et réponses"
      >
        <ul className="space-y-3">
          {supportRequests.length > 0 ? (
            supportRequests.map((item) => {
              const incoming = item.caregiverId === currentUserId;
              return (
                <li className="rounded-2xl bg-[#f5f7f4] p-4" key={item.id}>
                  <p className="font-bold text-[#18312f]">
                    {supportKinds.find((kind) => kind.value === item.kind)
                      ?.label ?? item.kind}
                  </p>
                  {item.message ? (
                    <p className="mt-1 text-sm leading-6 text-[#526765]">
                      {item.message}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs font-bold tracking-wide text-[#1e7775] uppercase">
                    {item.status}
                  </p>
                  {incoming && item.status === "pending" ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        className="min-h-11 rounded-2xl bg-[#1e7775] px-3 text-sm font-bold text-white"
                        disabled={isPending}
                        onClick={() => respond(item.id, "accepted")}
                        type="button"
                      >
                        Accepter
                      </button>
                      <button
                        className="min-h-11 rounded-2xl bg-[#f8e5e5] px-3 text-sm font-bold text-[#a13f49]"
                        disabled={isPending}
                        onClick={() => respond(item.id, "declined")}
                        type="button"
                      >
                        Décliner
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })
          ) : (
            <li className="rounded-2xl border border-dashed border-[#cad8d2] p-4 text-sm text-[#61716f]">
              Aucune demande pour l’instant.
            </li>
          )}
        </ul>
      </Panel>

      <p className="lg:col-span-2" aria-live="polite" role="status">
        {status ? (
          <span className="inline-flex rounded-full bg-[#dcede8] px-4 py-2 text-sm font-bold text-[#155c5a]">
            {status}
          </span>
        ) : null}
      </p>
    </div>
  );
}

function Panel({
  icon,
  eyebrow,
  title,
  children,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#dde4df] bg-[#fffdf8] p-5 shadow-[0_16px_40px_rgba(24,49,47,0.05)] sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#dcede8] text-[#1e7775]">
          {icon}
        </span>
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-[#1e7775] uppercase">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-bold text-[#18312f]">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  htmlFor,
  label,
  children,
}: {
  htmlFor: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        className="mb-2 block text-sm font-bold text-[#18312f]"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ActionButton({
  children,
  disabled,
}: {
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#1e7775] px-4 text-sm font-bold text-white outline-none hover:bg-[#155c5a] focus-visible:ring-2 focus-visible:ring-[#166f9e] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
      disabled={disabled}
      type="submit"
    >
      {children}
    </button>
  );
}
