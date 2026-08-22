import { BrandIllustration } from "@/components/brand/brand-illustration";
import { listAppointmentArtifacts } from "@/features/v2/appointments/artifact-service";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppointmentWorkspace } from "./appointment-workspace";

export const metadata = { title: "Préparer un rendez-vous" };

export default async function AppointmentPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const user = await getRequiredUser();
  const { appointmentId } = await params;
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId: user.id },
    select: {
      id: true,
      title: true,
      startsAt: true,
      timezone: true,
      location: true,
      preparationStatus: true,
      source: true,
    },
  });
  if (!appointment) notFound();
  const artifacts = await listAppointmentArtifacts(user.id, appointment.id);
  const startsAtLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: appointment.timezone,
  }).format(appointment.startsAt);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-12 sm:px-6 lg:px-8">
      <Link
        href="/consultation"
        className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-[#155c5a] outline-none hover:bg-[#eef5f2] focus-visible:ring-2 focus-visible:ring-[#166f9e]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Retour au soin
      </Link>

      <header className="grid overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#edf5f0,#f8e7d9)] sm:grid-cols-[minmax(0,1fr)_260px]">
        <div className="p-6 sm:p-8">
          <p className="text-xs font-bold tracking-[0.16em] text-[#1e7775] uppercase">
            Ton rendez-vous
          </p>
          <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-caption)] text-3xl font-bold tracking-[-0.035em] text-[#18312f] sm:text-5xl">
            {appointment.title}
          </h1>
          <div className="mt-5 flex flex-col gap-2 text-sm leading-6 text-[#526765] sm:flex-row sm:flex-wrap sm:gap-x-5">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4" aria-hidden="true" />
              {startsAtLabel}
            </span>
            {appointment.location ? (
              <span className="inline-flex items-center gap-2">
                <MapPin className="size-4" aria-hidden="true" />
                {appointment.location}
              </span>
            ) : null}
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-[#61716f]">
            Note ce qui compte quand cela te revient. Tu choisis ce qui entre
            dans le brief ; les questions marquées privées n’y apparaissent
            jamais.
          </p>
        </div>
        <BrandIllustration
          variant="brief"
          priority
          sizes="260px"
          className="mx-auto max-h-56 w-auto self-end"
        />
      </header>

      <AppointmentWorkspace
        appointmentId={appointment.id}
        initialArtifacts={artifacts}
      />
    </main>
  );
}
