import { Bouyotte } from "@/components/brand/bouyotte";
import { listGestures } from "@/features/couple/gesture.service";
import { getOpenLink, partnerOf } from "@/features/couple/link.service";
import { getUserContext } from "@/features/couple/shared";
import {
  AcceptCodeForm,
  EndLinkButton,
  InviteCard,
  PauseControls,
  SharingSettings,
} from "@/features/couple/ui/duo-controls";
import { GestureList } from "@/features/couple/ui/gesture-list";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { sharingLevels } from "@moodday/domain";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Duo" };

export default async function DuoPage(props: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await props.searchParams;
  const user = await getRequiredUser();
  const [context, link, gestures] = await Promise.all([
    getUserContext(user.id),
    getOpenLink(user.id),
    listGestures(user.id, 30),
  ]);
  const isOwner = context.role === "cycle_owner";
  const active = link?.status === "active" ? link : null;
  const partner = active ? partnerOf(active, user.id) : null;
  const pausedUntil =
    active?.pausedUntil && active.pausedUntil > new Date()
      ? active.pausedUntil.toISOString()
      : null;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-4xl font-extrabold sm:text-5xl">Duo</h1>
        <p className="text-muted-foreground mt-1 font-semibold">
          {partner && active
            ? `${context.name} & ${partner.name}, ensemble depuis le ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(active.acceptedAt ?? active.createdAt)}.`
            : isOwner
              ? "Invite la personne qui partage ta vie. Tu décides de tout ce qu'elle voit."
              : "C'est elle qui choisit ce qu'elle partage. Toi, tu apprends et tu réponds."}
        </p>
      </header>

      {!active && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="sticker flex flex-col gap-4 p-6">
            <h2 className="text-xl font-extrabold">
              {isOwner
                ? "Inviter mon ou ma partenaire"
                : "L'inviter à rejoindre Moodday"}
            </h2>
            <InviteCard
              role={isOwner ? "cycle_owner" : "supporter"}
              hasPendingInvite={link?.status === "invited"}
            />
          </section>
          <section className="sticker flex flex-col gap-4 p-6">
            <h2 className="text-xl font-extrabold">J'ai reçu un code</h2>
            <p className="text-muted-foreground text-sm">
              {isOwner
                ? "Ton ou ta partenaire t'a invitée ? Entre son code : tu choisiras ensuite ce qu'il ou elle voit."
                : "Elle t'a envoyé un code ? Entre-le ici."}
            </p>
            <AcceptCodeForm initialCode={code} />
          </section>
        </div>
      )}

      {active && partner && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section className="sticker flex flex-col gap-4 p-6">
            <div className="flex items-center gap-4">
              <Bouyotte
                mood={pausedUntil ? "sleepy" : "happy"}
                className="size-16"
              />
              <div>
                <h2 className="text-2xl font-extrabold">{partner.name}</h2>
                <p className="text-muted-foreground font-semibold">
                  {pausedUntil ? "Partage en pause" : "Duo actif"}
                </p>
              </div>
            </div>
            {isOwner ? (
              <>
                <SharingSettings
                  partnerName={partner.name}
                  ownerName={context.name}
                  level={active.level}
                  shareSymptoms={active.shareSymptoms}
                  detailedPreviews={active.detailedPreviews}
                />
                <hr className="border-[var(--ink)]/20" />
                <PauseControls pausedUntil={pausedUntil} />
              </>
            ) : (
              <p>
                {partner.name} partage :{" "}
                <strong>
                  {sharingLevels[active.level].label.toLowerCase()}
                </strong>
                {active.shareSymptoms ? ", avec ses symptômes" : ""}. Elle peut
                changer ce réglage quand elle veut.
              </p>
            )}
            <EndLinkButton partnerName={partner.name} />
          </section>
          <section className="sticker flex flex-col gap-4 p-6">
            <h2 className="text-xl font-extrabold">Historique des gestes</h2>
            <GestureList
              gestures={gestures}
              partnerName={partner.name}
              canThank={isOwner}
              emptyText="Rien pour l'instant. Les premiers gestes arrivent avec les premiers points."
            />
          </section>
        </div>
      )}
    </div>
  );
}
