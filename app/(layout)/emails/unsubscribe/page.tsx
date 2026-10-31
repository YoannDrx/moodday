import { Bouyotte } from "@/components/brand/bouyotte";
import type { Metadata } from "next";
import { UnsubscribeForm } from "./unsubscribe-form";

export const metadata: Metadata = {
  title: "Se désabonner des conseils",
  robots: { index: false },
};

export default async function UnsubscribePage(props: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await props.searchParams;
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-16">
      <Bouyotte mood="sleepy" className="size-20" />
      <h1 className="text-4xl font-extrabold">
        Moins d'e-mails ? Aucun souci.
      </h1>
      <p className="text-muted-foreground text-lg">
        Tu ne recevras plus les conseils de démarrage de Moodday. Ton compte,
        ton duo et tes données ne changent pas.
      </p>
      {token ? (
        <UnsubscribeForm token={token} />
      ) : (
        <p className="font-semibold">Il manque le lien complet de l'e-mail.</p>
      )}
    </div>
  );
}
