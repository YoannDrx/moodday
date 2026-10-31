import { Bouyotte } from "@/components/brand/bouyotte";
import type { PropsWithChildren } from "react";

export default function RouteLayout(props: PropsWithChildren) {
  return (
    <div className="bg-background grid min-h-full grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(360px,0.82fr)_minmax(520px,1.18fr)]">
      <aside className="knit relative hidden overflow-hidden border-r-2 border-[var(--ink)] bg-[#2b1b30] px-10 py-12 text-[#fbf4ea] lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="relative">
          <p className="text-honey text-xs font-bold tracking-[0.18em] uppercase">
            Le SPM, ça se traverse à deux
          </p>
          <h1 className="mt-4 max-w-md text-4xl leading-[1.05] font-extrabold xl:text-5xl">
            Elle n'a plus à tout expliquer. Son duo sait enfin quoi faire.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-[#e8dcea]">
            Un point de dix secondes, un geste en retour. Tes données restent à
            toi, du premier au dernier jour.
          </p>
        </div>
        <Bouyotte
          mood="happy"
          steam
          className="animate-float relative size-40"
        />
        <p className="relative max-w-sm text-xs leading-5 text-[#e8dcea]">
          Sans diagnostic · sans publicité · tu choisis ce qui est partagé
        </p>
      </aside>
      <main className="relative flex min-h-full min-w-0 flex-col items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
        <Bouyotte mood="wink" className="mb-2 size-20 lg:hidden" />
        {props.children}
      </main>
    </div>
  );
}
