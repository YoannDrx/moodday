import { BrandIllustration } from "@/components/brand/brand-illustration";
import {
  CircleAccessDeniedError,
  previewCircleInvitation,
} from "@/features/v2/circle/service";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { CircleInvitationAcceptance } from "./circle-invitation-acceptance";

export const metadata = {
  title: "Invitation au Cercle",
  referrer: "no-referrer" as const,
};

export default async function CircleAcceptPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const user = await getRequiredUser();
  const { token } = await searchParams;
  if (!token) return <InvalidInvitation />;

  try {
    const relationship = await previewCircleInvitation({
      caregiverEmail: user.email,
      invitationToken: token,
    });
    return (
      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-12 sm:px-6 lg:px-8">
        <header className="grid overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#edf5f0,#f7e9df)] sm:grid-cols-[minmax(0,1fr)_220px]">
          <div className="p-6 sm:p-8">
            <p className="text-xs font-bold tracking-[0.16em] text-[#1e7775] uppercase">
              Invitation au Cercle
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-caption)] text-3xl font-bold tracking-[-0.04em] text-[#18312f] sm:text-4xl">
              Lis exactement ce qui sera partagé
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#61716f]">
              Tu peux accepter ou simplement fermer cette page. Rien n’est
              partagé avant ton accord.
            </p>
          </div>
          <BrandIllustration
            variant="circle"
            priority
            sizes="220px"
            className="mx-auto max-h-48 w-auto self-end"
          />
        </header>
        <CircleInvitationAcceptance
          invitationToken={token}
          relationship={relationship}
        />
      </main>
    );
  } catch (error) {
    if (error instanceof CircleAccessDeniedError) return <InvalidInvitation />;
    throw error;
  }
}

function InvalidInvitation() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-12 sm:px-6 lg:px-8">
      <section className="rounded-[28px] border border-[#e2d3c5] bg-[#fff8f1] p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-[#18312f]">
          Cette invitation n’est pas disponible
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#61716f]">
          Elle est peut-être expirée, déjà utilisée, révoquée ou liée à une
          autre adresse e-mail. Aucun accès n’a été accordé.
        </p>
      </section>
    </main>
  );
}
