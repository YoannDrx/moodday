import { BrandIllustration } from "@/components/brand/brand-illustration";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import {
  addCivilDays,
  getDateKeyForTimeZone,
  getSafeTimeZone,
} from "@/lib/temporal/civil-date";
import { ConsultationPreparationEditor } from "./consultation-preparation-editor";
import { getEntitlements } from "@/lib/billing/entitlements";
import { getFeatureAvailability } from "@/lib/features/availability";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  Leaf,
  Pill,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const metadata = { title: "Préparer une consultation" };

export default async function ConsultationPage() {
  const user = await getRequiredUser();
  const [preparations, preferences, subscription, appointments, routines] =
    await Promise.all([
      prisma.consultationPreparation.findMany({
        where: { userId: user.id, status: { not: "archived" } },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
      prisma.userPreferences.findUnique({
        where: { userId: user.id },
        select: { timezone: true },
      }),
      prisma.subscription.findUnique({ where: { referenceId: user.id } }),
      prisma.appointment.findMany({
        where: {
          userId: user.id,
          status: "scheduled",
          startsAt: { gte: new Date() },
        },
        orderBy: { startsAt: "asc" },
        take: 3,
        select: {
          id: true,
          title: true,
          startsAt: true,
          location: true,
          preparationStatus: true,
          source: true,
        },
      }),
      prisma.routine.findMany({
        where: { userId: user.id, status: { in: ["active", "paused"] } },
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          weeklyTarget: true,
          status: true,
        },
      }),
    ]);
  const timezone = getSafeTimeZone(preferences?.timezone);
  const todayDate = getDateKeyForTimeZone(new Date(), timezone);
  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 pb-12 sm:px-6 lg:px-8">
      <header className="grid items-center gap-4 overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#f0f6f2,#f8e9dc)] px-6 pt-6 sm:grid-cols-[minmax(0,1fr)_240px] sm:px-8 sm:pt-8">
        <div className="pb-6 sm:pb-8">
          <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
            Continuité de soin
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-caption)] text-4xl font-bold tracking-[-0.04em] text-[#18312f] sm:text-5xl">
            Soin
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#61716f]">
            Tes rendez-vous, traitements, routines et ressources importantes au
            même endroit.
          </p>
        </div>
        <BrandIllustration
          variant="appointment"
          priority
          sizes="240px"
          className="mx-auto max-h-52 w-auto self-end"
        />
      </header>

      <section
        aria-label="Accès au soin"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        <CareLink
          href="/medications/today"
          icon={Pill}
          title="Traitements"
          description="Prises du jour, changements, stock et prises si besoin."
        />
        <CareLink
          href="/therapy"
          icon={HeartPulse}
          title="Rendez-vous"
          description="Préparation, séance, débrief et décisions."
        />
        <CareLink
          href="/exercises"
          icon={Sparkles}
          title="Routines"
          description="Des objectifs souples, sans série à préserver."
        />
        <CareLink
          href="/safety-plan"
          icon={ShieldCheck}
          title="Plan de sécurité"
          description="Tes repères et contacts, disponibles hors ligne."
        />
      </section>

      <section
        className="grid gap-5 lg:grid-cols-2"
        aria-label="Continuité de soin V2"
      >
        <article className="rounded-[28px] border border-[#dde4df] bg-[#fffdf8] p-5 shadow-[0_16px_40px_rgba(24,49,47,0.05)] sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#dcede8] text-[#1e7775]">
              <CalendarDays className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-[#1e7775] uppercase">
                Rendez-vous à venir
              </p>
              <h2 className="mt-1 text-xl font-bold text-[#18312f]">
                Préparer au fil des jours
              </h2>
            </div>
          </div>
          {appointments.length > 0 ? (
            <ul className="mt-5 divide-y divide-[#e5e9e6]">
              {appointments.map((appointment) => (
                <li key={appointment.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#18312f]">
                        {appointment.title}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-[#61716f]">
                        {new Intl.DateTimeFormat("fr-FR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: timezone,
                        }).format(appointment.startsAt)}
                        {appointment.location
                          ? ` · ${appointment.location}`
                          : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#eef5f2] px-3 py-1 text-xs font-bold text-[#155c5a]">
                      {appointment.preparationStatus === "not_started"
                        ? "À préparer"
                        : appointment.preparationStatus === "in_progress"
                          ? "En préparation"
                          : appointment.preparationStatus === "ready"
                            ? "Prêt"
                            : "Relu"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[#7b8886]">
                    Source ·{" "}
                    {appointment.source === "moodday"
                      ? "Mood Day"
                      : "Calendrier"}
                  </p>
                  <Link
                    href={`/consultation/${appointment.id}`}
                    className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#dcede8] px-4 text-sm font-bold text-[#155c5a] transition outline-none hover:bg-[#cee4dd] focus-visible:ring-2 focus-visible:ring-[#166f9e] focus-visible:ring-offset-2 motion-reduce:transition-none"
                  >
                    Préparer ce rendez-vous
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-[#cad8d2] bg-[#f8faf8] p-5">
              <p className="font-bold text-[#18312f]">
                Aucun rendez-vous prévu
              </p>
              <p className="mt-1 text-sm leading-6 text-[#61716f]">
                Un rendez-vous ajouté depuis l’app mobile apparaîtra ici après
                synchronisation.
              </p>
            </div>
          )}
        </article>

        <article className="rounded-[28px] border border-[#dde4df] bg-[#fffdf8] p-5 shadow-[0_16px_40px_rgba(24,49,47,0.05)] sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#f6e4d4] text-[#744c30]">
              <Leaf className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-[#1e7775] uppercase">
                Routines souples
              </p>
              <h2 className="mt-1 text-xl font-bold text-[#18312f]">
                Des repères, jamais une dette
              </h2>
            </div>
          </div>
          {routines.length > 0 ? (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {routines.map((routine) => (
                <li key={routine.id} className="rounded-2xl bg-[#f3f6f3] p-4">
                  <p className="font-bold text-[#18312f]">{routine.title}</p>
                  <p className="mt-1 text-sm text-[#61716f]">
                    {routine.status === "paused"
                      ? "En pause · reprends quand ce sera utile"
                      : routine.weeklyTarget
                        ? `Intention · ${routine.weeklyTarget} fois par semaine`
                        : "Intention hebdomadaire libre"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-[#e2d3c5] bg-[#fdf8f3] p-5">
              <p className="font-bold text-[#18312f]">
                Aucune routine à maintenir
              </p>
              <p className="mt-1 text-sm leading-6 text-[#61716f]">
                Tu peux en créer une sur mobile, même hors ligne, sans série ni
                message de retard.
              </p>
            </div>
          )}
        </article>
      </section>

      <section className="rounded-[28px] border border-[#dde4df] bg-[#fffdf8] p-4 shadow-[0_16px_40px_rgba(24,49,47,0.05)] sm:p-6">
        <div className="mb-6 flex items-start gap-3 px-1">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#f6e4d4] text-[#744c30]">
            <ClipboardList className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-[#18312f]">
              Préparer une consultation
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#61716f]">
              Rassemble uniquement ce que tu choisis de partager. Les notes
              privées restent exclues.
            </p>
          </div>
          <BrandIllustration
            variant="brief"
            sizes="110px"
            className="ml-auto hidden max-h-24 w-auto sm:block"
          />
        </div>
        <ConsultationPreparationEditor
          preparations={preparations}
          todayDate={todayDate}
          initialStartDate={addCivilDays(todayDate, -30)}
          timezone={timezone}
          canCreateReport={getEntitlements(subscription).consultationReports}
          billingEnabled={getFeatureAvailability("billing").enabled}
        />
      </section>
    </main>
  );
}

function CareLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-44 flex-col rounded-[22px] border border-[#dde4df] bg-[#fffdf8] p-5 shadow-[0_10px_30px_rgba(24,49,47,0.04)] transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#166f9e] focus-visible:outline-none motion-reduce:transform-none"
    >
      <span className="flex size-11 items-center justify-center rounded-2xl bg-[#dcede8] text-[#1e7775]">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-bold text-[#18312f]">{title}</h2>
      <p className="mt-1 flex-1 text-sm leading-5 text-[#61716f]">
        {description}
      </p>
      <ArrowRight
        className="mt-3 size-4 text-[#1e7775] transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
        aria-hidden="true"
      />
    </Link>
  );
}
