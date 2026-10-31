import { cn } from "@/lib/utils";
import {
  addDays,
  daysBetween,
  stateCatalog,
  toUtcMs,
  type CheckInStateKey,
  type CivilDate,
} from "@moodday/domain";
import Link from "next/link";

const weekdays = ["L", "M", "M", "J", "V", "S", "D"];
const stateDot: Record<CheckInStateKey, string> = {
  ok: "bg-mint",
  fragile: "bg-honey",
  hard: "bg-apricot",
  very_hard: "bg-plum",
};

type Props = {
  month: string; // YYYY-MM
  today: CivilDate;
  periods: { startDate: CivilDate; endDate: CivilDate | null }[];
  averagePeriodLength: number;
  nextPeriodStart: CivilDate | null;
  pmsDaysBefore: number;
  checkIns: { localDate: CivilDate; state: CheckInStateKey }[];
};

const inPeriod = (
  date: CivilDate,
  periods: Props["periods"],
  today: CivilDate,
  averageLength: number,
) =>
  periods.some((period) => {
    const end =
      period.endDate ??
      (date <= today
        ? addDays(period.startDate, averageLength - 1)
        : period.startDate);
    return date >= period.startDate && date <= end && date <= today;
  });

export function CycleCalendar(props: Props) {
  const first = `${props.month}-01`;
  const [year = 1970, month = 1] = props.month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const offset = (new Date(toUtcMs(first)).getUTCDay() + 6) % 7;
  const checkInByDate = new Map(
    props.checkIns.map((point) => [point.localDate, point.state]),
  );
  const previous = addDays(first, -1).slice(0, 7);
  const next = addDays(first, daysInMonth).slice(0, 7);
  const title = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(toUtcMs(first)));

  const predicted = (date: CivilDate) =>
    Boolean(
      props.nextPeriodStart &&
        date >= props.nextPeriodStart &&
        daysBetween(props.nextPeriodStart, date) < props.averagePeriodLength &&
        date > props.today,
    );
  const beforePeriod = (date: CivilDate) =>
    Boolean(
      props.nextPeriodStart &&
        date < props.nextPeriodStart &&
        daysBetween(date, props.nextPeriodStart) <= props.pmsDaysBefore &&
        date >= props.today,
    );

  return (
    <section className="sticker p-5" aria-label={`Calendrier ${title}`}>
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/cycle?mois=${previous}`}
          className="hover:bg-accent rounded-full px-3 py-1 font-bold"
        >
          ← <span className="sr-only">Mois précédent</span>
        </Link>
        <h2 className="text-xl font-extrabold capitalize">{title}</h2>
        <Link
          href={`/cycle?mois=${next}`}
          className="hover:bg-accent rounded-full px-3 py-1 font-bold"
        >
          → <span className="sr-only">Mois suivant</span>
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center" role="list">
        {weekdays.map((day, index) => (
          <span
            key={index}
            className="text-muted-foreground text-xs font-bold"
            aria-hidden
          >
            {day}
          </span>
        ))}
        {Array.from({ length: offset }, (_, index) => (
          <span key={`empty-${index}`} aria-hidden="true" />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const date = addDays(first, index);
          const period = inPeriod(
            date,
            props.periods,
            props.today,
            props.averagePeriodLength,
          );
          const isPredicted = !period && predicted(date);
          const isBefore = !period && !isPredicted && beforePeriod(date);
          const state = checkInByDate.get(date);
          const labels = [
            period && "règles",
            isPredicted && "règles prévues",
            isBefore && "avant les règles",
            state && `point : ${stateCatalog[state].label}`,
            date === props.today && "aujourd'hui",
          ].filter(Boolean);
          return (
            <div
              key={date}
              role="listitem"
              aria-label={`${index + 1}${labels.length ? `, ${labels.join(", ")}` : ""}`}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-xl border-2 text-sm font-bold",
                period && "bg-apricot border-[var(--ink)] text-[#2b1b30]",
                isPredicted &&
                  "bg-apricot-soft border-dashed border-[var(--ink)]",
                isBefore && "bg-plum-soft/40 border-transparent",
                !period && !isPredicted && !isBefore && "border-transparent",
                date === props.today && "ring-4 ring-[var(--honey)]",
              )}
            >
              {index + 1}
              {state && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute bottom-1 size-2 rounded-full border border-[var(--ink)]",
                    stateDot[state],
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
        <li className="flex items-center gap-1.5">
          <span
            className="bg-apricot size-3 rounded border border-[var(--ink)]"
            aria-hidden
          />{" "}
          Règles
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="bg-apricot-soft size-3 rounded border border-dashed border-[var(--ink)]"
            aria-hidden
          />{" "}
          Prévues
        </li>
        <li className="flex items-center gap-1.5">
          <span className="bg-plum-soft/60 size-3 rounded" aria-hidden /> Avant
          les règles
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="bg-honey size-2.5 rounded-full border border-[var(--ink)]"
            aria-hidden
          />{" "}
          Un point
        </li>
      </ul>
    </section>
  );
}
