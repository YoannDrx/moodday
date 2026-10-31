import { Bouyotte } from "@/components/brand/bouyotte";
import { listCheckIns } from "@/features/couple/check-in.service";
import { getCycleSnapshot, listPeriods } from "@/features/couple/cycle.service";
import { readPartnerView } from "@/features/couple/partner-view.service";
import { getUserContext, toCivil } from "@/features/couple/shared";
import { CycleCalendar } from "@/features/couple/ui/cycle-calendar";
import {
  DeletePeriodButton,
  PeriodButtons,
} from "@/features/couple/ui/period-buttons";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { addDays, type CyclePhase } from "@moodday/domain";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Cycle" };

const phaseGuide: Record<
  Exclude<CyclePhase, "unknown">,
  { title: string; her: string; you: string }
> = {
  period: {
    title: "Pendant les règles",
    her: "Fatigue, crampes, besoin de chaleur. Pour beaucoup, l'humeur remonte au fil des jours.",
    you: "Bouillotte, repas simple, moins de charge mentale. Et pas de blague sur les règles.",
  },
  between: {
    title: "L'entre-deux",
    her: "Souvent la période la plus légère du cycle. L'énergie revient.",
    you: "Le bon moment pour les projets, les sorties, et parler de ce qui a aidé la dernière fois.",
  },
  before: {
    title: "Avant les règles",
    her: "Irritabilité, fatigue, sensibilité possibles. Ce n'est ni un caprice, ni « dans sa tête ».",
    you: "Moins de sujets lourds, plus de petites attentions. Suis ses besoins du jour, pas le calendrier.",
  },
  late: {
    title: "Règles attendues",
    her: "Le cycle varie d'un mois à l'autre. Un retard de quelques jours est fréquent.",
    you: "Pas de questions insistantes. Elle t'en parlera si elle en a envie.",
  },
};

export default async function CyclePage(props: {
  searchParams: Promise<{ mois?: string }>;
}) {
  const user = await getRequiredUser();
  const context = await getUserContext(user.id);
  const { mois } = await props.searchParams;
  const month =
    mois && /^\d{4}-\d{2}$/u.test(mois) ? mois : context.today.slice(0, 7);

  if (context.role === "supporter") {
    const view = await readPartnerView(user.id);
    if (!view) {
      return (
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-extrabold sm:text-5xl">Son cycle</h1>
          <section className="sticker flex items-center gap-4 p-6">
            <Bouyotte mood="sleepy" className="size-20" />
            <p className="text-lg">
              Rien à afficher tant que vous n'êtes pas relié·e·s.{" "}
              <Link href="/duo" className="font-bold underline">
                Former votre duo
              </Link>
            </p>
          </section>
        </div>
      );
    }
    if (view.status === "paused") {
      return (
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-extrabold sm:text-5xl">Son cycle</h1>
          <p className="sticker p-6 text-lg">
            {view.ownerName} a mis le partage en pause.
          </p>
        </div>
      );
    }
    const phase = view.cycle.phase;
    return (
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-4xl font-extrabold sm:text-5xl">
            Le cycle de {view.ownerName}
          </h1>
          <p className="text-muted-foreground mt-1 font-semibold">
            En lecture seule. C'est elle qui renseigne tout.
          </p>
        </header>
        <section className="sticker bg-honey-soft flex flex-col gap-2 p-6">
          <p className="text-sm font-bold uppercase">Aujourd'hui</p>
          <p className="font-display text-3xl font-extrabold">
            {view.cycle.phaseText}
          </p>
          {view.cycle.daysUntilNextPeriod !== null &&
            view.cycle.daysUntilNextPeriod > 0 && (
              <p>
                Règles prévues dans environ {view.cycle.daysUntilNextPeriod}{" "}
                jours.
              </p>
            )}
          <p className="text-muted-foreground text-sm">
            Une estimation, qui ne dit rien de son humeur. Pour ça, il y a son
            point du jour.
          </p>
        </section>
        <div className="grid gap-4 md:grid-cols-2">
          {(Object.keys(phaseGuide) as (keyof typeof phaseGuide)[]).map(
            (key) => (
              <article
                key={key}
                className={`sticker flex flex-col gap-2 p-5 ${key === phase ? "ring-4 ring-[var(--honey)]" : ""}`}
              >
                <h2 className="text-lg font-extrabold">
                  {phaseGuide[key].title}
                  {key === phase && (
                    <span className="text-sm font-bold"> · en ce moment</span>
                  )}
                </h2>
                <p>
                  <strong>Pour elle :</strong> {phaseGuide[key].her}
                </p>
                <p>
                  <strong>Pour toi :</strong> {phaseGuide[key].you}
                </p>
              </article>
            ),
          )}
        </div>
      </div>
    );
  }

  const [cycle, periods, checkIns] = await Promise.all([
    getCycleSnapshot(user.id, context.today),
    listPeriods(user.id),
    listCheckIns(
      user.id,
      addDays(`${month}-01`, -7),
      addDays(`${month}-01`, 40),
    ),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold sm:text-5xl">Mon cycle</h1>
          <p className="text-muted-foreground mt-1 font-semibold">
            {cycle.cycleDay
              ? `Jour ${cycle.cycleDay} · ${cycle.phaseTitle.toLowerCase()}`
              : "Note tes prochaines règles pour démarrer."}
          </p>
        </div>
        <PeriodButtons today={context.today} ongoing={cycle.periodOngoing} />
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <CycleCalendar
          month={month}
          today={context.today}
          periods={periods}
          averagePeriodLength={cycle.averagePeriodLength}
          nextPeriodStart={cycle.nextPeriodStart}
          pmsDaysBefore={cycle.pmsWindow.daysBefore}
          checkIns={checkIns.map((checkIn) => ({
            localDate: toCivil(checkIn.localDate),
            state: checkIn.state,
          }))}
        />
        <div className="flex flex-col gap-6">
          <section className="sticker bg-mint-soft flex flex-col gap-2 p-5">
            <h2 className="text-lg font-extrabold">Tes repères</h2>
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-muted-foreground text-xs font-bold uppercase">
                  Cycle moyen
                </dt>
                <dd className="font-display text-2xl font-extrabold">
                  {cycle.averageCycleLength} j
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-bold uppercase">
                  Règles
                </dt>
                <dd className="font-display text-2xl font-extrabold">
                  {cycle.averagePeriodLength} j
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground text-xs font-bold uppercase">
                  Prochaines règles
                </dt>
                <dd className="font-bold">
                  {cycle.nextPeriodStart
                    ? new Intl.DateTimeFormat("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        timeZone: "UTC",
                      }).format(new Date(`${cycle.nextPeriodStart}T00:00:00Z`))
                    : "À découvrir"}
                  {cycle.confidence === "low" &&
                    " (estimation encore approximative)"}
                </dd>
              </div>
            </dl>
            <p className="text-sm">
              {cycle.pmsInsight ??
                "Fais ton point quelques jours par cycle : après deux cycles, Moodday te montre quand les journées plus difficiles ont tendance à arriver."}
            </p>
          </section>
          <section className="sticker flex flex-col gap-3 p-5">
            <h2 className="text-lg font-extrabold">Règles notées</h2>
            {periods.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucune pour l'instant.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {periods.slice(0, 8).map((period) => {
                  const label = `du ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${period.startDate}T00:00:00Z`))}${period.endDate ? ` au ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${period.endDate}T00:00:00Z`))}` : " (en cours)"}`;
                  return (
                    <li
                      key={period.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="font-semibold capitalize">{label}</span>
                      <DeletePeriodButton periodId={period.id} label={label} />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
