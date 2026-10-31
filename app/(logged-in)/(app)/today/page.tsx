import { Bouyotte } from "@/components/brand/bouyotte";
import { buttonVariants } from "@/components/ui/button";
import { listCustomNeeds } from "@/features/couple/check-in.service";
import { markGesturesSeen } from "@/features/couple/gesture.service";
import { getUserContext } from "@/features/couple/shared";
import { getToday } from "@/features/couple/today.service";
import { CheckInPanel } from "@/features/couple/ui/check-in-panel";
import { GestureButtons } from "@/features/couple/ui/gesture-buttons";
import { GestureList } from "@/features/couple/ui/gesture-list";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { cn } from "@/lib/utils";
import { localTimeInTimeZone, stateCatalog } from "@moodday/domain";
import { ArrowRight, GraduationCap, PauseCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Aujourd'hui" };

const greeting = (name: string, timeZone: string) => {
  const hour = Number(localTimeInTimeZone(new Date(), timeZone).slice(0, 2));
  return hour < 5
    ? `Encore debout, ${name} ?`
    : hour < 18
      ? `Bonjour ${name}`
      : `Bonsoir ${name}`;
};

const cycleLine = (cycle: {
  cycleDay: number | null;
  daysUntilNextPeriod: number | null;
  periodOngoing: boolean;
  phase: string;
}) => {
  if (cycle.cycleDay === null)
    return "Note tes prochaines règles pour que Moodday apprenne ton rythme.";
  if (cycle.periodOngoing) return `Jour ${cycle.cycleDay} · règles en cours`;
  if (cycle.phase === "late")
    return `Jour ${cycle.cycleDay} · règles attendues`;
  return `Jour ${cycle.cycleDay} · règles prévues dans ~${cycle.daysUntilNextPeriod} jour${cycle.daysUntilNextPeriod === 1 ? "" : "s"}`;
};

export default async function TodayPage() {
  const user = await getRequiredUser();
  const [today, context] = await Promise.all([
    getToday(user.id),
    getUserContext(user.id),
  ]);
  const name = today.displayName ?? "toi";

  if (today.owner) {
    await markGesturesSeen(user.id);
    const customNeeds = await listCustomNeeds(user.id);
    const partnerName =
      today.link?.status === "active" ? today.link.partnerName : null;
    return (
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-4xl font-extrabold sm:text-5xl">
            {greeting(name, context.timeZone)}
          </h1>
          <p className="text-muted-foreground mt-1 font-semibold">
            {cycleLine(today.owner.cycle)}
          </p>
        </header>

        <CheckInPanel
          localDate={today.localDate}
          timeZone={context.timeZone}
          partnerName={partnerName}
          showsNeedsToPartner={today.link?.level === "cycle_state_needs"}
          checkIn={today.owner.checkIn}
          customNeeds={customNeeds}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <section
            className="sticker flex flex-col gap-4 p-5"
            aria-labelledby="partner-side"
          >
            <h2 id="partner-side" className="text-xl font-extrabold">
              {partnerName ? `Côté ${partnerName}` : "Ton duo"}
            </h2>
            {!today.link && (
              <>
                <p className="text-muted-foreground">
                  Personne n'est invité pour l'instant. Moodday marche très bien
                  en solo, et encore mieux à deux.
                </p>
                <Link
                  href="/duo"
                  className={cn(buttonVariants({ variant: "honey" }), "w-fit")}
                >
                  Inviter mon ou ma partenaire
                </Link>
              </>
            )}
            {today.link?.status === "invited" && (
              <p className="text-muted-foreground">
                Invitation envoyée, on attend que ton duo entre le code.{" "}
                <Link href="/duo" className="font-bold underline">
                  Revoir le code
                </Link>
              </p>
            )}
            {today.link?.pausedUntil && (
              <p className="flex items-center gap-2 font-semibold">
                <PauseCircle className="size-5" aria-hidden /> Partage en pause,
                rien n'est envoyé.
              </p>
            )}
            {today.link?.status === "active" && (
              <GestureList
                gestures={today.owner.gestures.slice(0, 5)}
                partnerName={partnerName}
                canThank
                emptyText={
                  today.owner.checkIn
                    ? `${partnerName} n'a pas encore réagi. Laisse-lui une minute.`
                    : `Fais ton point : ${partnerName} recevra des idées pour t'aider.`
                }
              />
            )}
          </section>

          <section
            className="sticker bg-mint-soft flex flex-col gap-3 p-5"
            aria-labelledby="insight"
          >
            <h2 id="insight" className="text-xl font-extrabold">
              {today.owner.cycle.phaseTitle}
            </h2>
            <p>
              {today.owner.cycle.pmsInsight ??
                "Après deux cycles de points, Moodday te montre quand tes journées plus difficiles ont tendance à arriver. Juste des repères, jamais un diagnostic."}
            </p>
            <Link
              href="/cycle"
              className="font-bold underline underline-offset-4"
            >
              Voir mon cycle
            </Link>
          </section>
        </div>
      </div>
    );
  }

  const supporter = today.supporter;
  const partner = supporter?.partner ?? null;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-4xl font-extrabold sm:text-5xl">Salut {name}</h1>
        <p className="text-muted-foreground mt-1 font-semibold">
          {partner?.status === "active" && partner.today
            ? `${partner.ownerName} a partagé son point à ${new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(partner.today.sharedAt))}.`
            : partner
              ? `Le duo avec ${partner.ownerName} est actif.`
              : "Tu n'es pas encore relié·e à ta ou ton partenaire."}
        </p>
      </header>

      {!partner && (
        <section className="sticker flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <Bouyotte mood="wink" className="size-24" />
          <div className="flex flex-1 flex-col gap-3">
            <h2 className="text-2xl font-extrabold">
              Invite-la, ou entre son code
            </h2>
            <p className="text-muted-foreground">
              C'est elle qui crée son espace et choisit ce qu'elle partage. En
              attendant, le Programme Allié t'attend.
            </p>
            <Link
              href="/duo"
              className={cn(buttonVariants({ variant: "honey" }), "w-fit")}
            >
              Former notre duo
            </Link>
          </div>
        </section>
      )}

      {partner?.status === "paused" && (
        <section className="sticker flex items-center gap-4 p-6">
          <PauseCircle className="size-10 shrink-0" aria-hidden />
          <p className="text-lg font-semibold">
            {partner.ownerName} a mis le partage en pause. Rien à faire, juste à
            être là.
          </p>
        </section>
      )}

      {partner?.status === "active" && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section
            className="sticker flex flex-col gap-4 p-6"
            aria-labelledby="her-day"
          >
            {partner.today ? (
              <>
                <div className="flex items-center gap-4">
                  <Bouyotte mood={partner.today.state} className="size-20" />
                  <div>
                    <p className="text-muted-foreground text-sm font-bold uppercase">
                      Son point du jour
                    </p>
                    <h2
                      id="her-day"
                      className="font-display text-3xl font-extrabold"
                    >
                      {stateCatalog[partner.today.state].label}
                    </h2>
                  </div>
                </div>
                {partner.today.needs.length > 0 && (
                  <p className="text-lg">
                    {partner.ownerName} aimerait :{" "}
                    <strong>
                      {partner.today.needs
                        .map((need) => need.label.toLowerCase())
                        .join(", ")}
                    </strong>
                    .
                  </p>
                )}
                {partner.today.symptoms.length > 0 && (
                  <p className="text-sm">
                    <span className="font-bold">Elle a noté :</span>{" "}
                    {partner.today.symptoms.join(", ").toLowerCase()}
                  </p>
                )}
                <h3 className="mt-2 text-lg font-extrabold">
                  Ce que tu peux faire
                </h3>
                <GestureButtons
                  checkInId={partner.today.checkInId}
                  suggestions={partner.today.suggestions}
                  ownerName={partner.ownerName}
                />
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <Bouyotte mood="sleepy" className="size-20" />
                <h2 id="her-day" className="text-2xl font-extrabold">
                  {partner.checkedInPrivately
                    ? `${partner.ownerName} a fait son point, en privé.`
                    : "Pas de point aujourd'hui."}
                </h2>
                <p className="text-muted-foreground">
                  {partner.checkedInPrivately
                    ? "Son niveau de partage garde les détails pour elle. Tu peux quand même envoyer une attention."
                    : "Pas de nouvelles, peut-être bonne nouvelle. Tu peux quand même envoyer une attention."}
                </p>
                <GestureButtons
                  checkInId={null}
                  suggestions={[
                    { key: "thinking_of_you", label: "Je pense à toi" },
                    { key: "here", label: "Je suis là" },
                  ]}
                  ownerName={partner.ownerName}
                />
              </div>
            )}
          </section>

          <div className="flex flex-col gap-6">
            {partner.today && partner.today.avoid.length > 0 && (
              <section className="sticker bg-apricot-soft flex flex-col gap-2 p-5">
                <h2 className="text-lg font-extrabold">À éviter aujourd'hui</h2>
                <ul className="list-disc pl-5">
                  {partner.today.avoid.map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              </section>
            )}
            <section className="sticker flex flex-col gap-2 p-5">
              <h2 className="text-lg font-extrabold">Son cycle</h2>
              <p>{partner.phaseText}</p>
              {partner.daysUntilNextPeriod !== null &&
                partner.daysUntilNextPeriod > 0 && (
                  <p className="text-muted-foreground text-sm">
                    Règles prévues dans environ {partner.daysUntilNextPeriod}{" "}
                    jour
                    {partner.daysUntilNextPeriod === 1 ? "" : "s"}. Une
                    estimation, pas une météo de son humeur.
                  </p>
                )}
            </section>
            <section className="sticker flex flex-col gap-3 p-5">
              <h2 className="text-lg font-extrabold">Vos derniers gestes</h2>
              <GestureList
                gestures={supporter?.gestures.slice(0, 4) ?? []}
                partnerName={partner.ownerName}
                canThank={false}
                emptyText="Aucun geste pour l'instant. Le premier est souvent le plus apprécié."
              />
            </section>
          </div>
        </div>
      )}

      {supporter?.nextLesson && (
        <Link
          href={`/ally/${supporter.nextLesson.slug}`}
          className="sticker sticker-hover flex items-center gap-4 bg-[#2b1b30] p-5 text-[#fbf4ea]"
        >
          <GraduationCap className="text-honey size-10 shrink-0" aria-hidden />
          <div className="flex-1">
            <p className="text-honey text-xs font-bold uppercase">
              Programme Allié · Jour {supporter.nextLesson.day}/7 · 2 min
            </p>
            <p className="text-xl font-extrabold">
              {supporter.nextLesson.title}
            </p>
          </div>
          <ArrowRight className="size-6" aria-hidden />
        </Link>
      )}
    </div>
  );
}
