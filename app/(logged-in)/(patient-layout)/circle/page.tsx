import { BrandIllustration } from "@/components/brand/brand-illustration";
import { listCircleRelationships } from "@/features/v2/circle/service";
import { listSupportRequests } from "@/features/v2/support-requests/service";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { getFeatureAvailability } from "@/lib/features/availability";
import { CircleWorkspace } from "./circle-workspace";

export const metadata = { title: "Cercle" };

export default async function CirclePage() {
  const user = await getRequiredUser();
  const enabled = getFeatureAvailability("caregiverSharing").enabled;
  const [relationships, supportRequests] = enabled
    ? await Promise.all([
        listCircleRelationships(user.id),
        listSupportRequests(user.id),
      ])
    : [[], []];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-12 sm:px-6 lg:px-8">
      <header className="grid overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#edf5f0,#f7e9df)] sm:grid-cols-[minmax(0,1fr)_260px]">
        <div className="p-6 sm:p-8">
          <p className="text-xs font-bold tracking-[0.16em] text-[#1e7775] uppercase">
            Ton soutien, à tes conditions
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-caption)] text-4xl font-bold tracking-[-0.04em] text-[#18312f] sm:text-5xl">
            Cercle
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#61716f]">
            Tu choisis la personne, la durée, ce qu’elle voit et la demande que
            tu lui adresses. Mood Day n’envoie jamais d’alerte automatique sur
            ton état.
          </p>
        </div>
        <BrandIllustration
          variant="circle"
          priority
          sizes="260px"
          className="mx-auto max-h-56 w-auto self-end"
        />
      </header>

      <CircleWorkspace
        currentUserId={user.id}
        enabled={enabled}
        initialRelationships={relationships}
        initialSupportRequests={supportRequests}
      />
    </main>
  );
}
