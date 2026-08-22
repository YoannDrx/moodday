import { BrandIllustration } from "@/components/brand/brand-illustration";
import { getI18n } from "@/i18n/server";
import type { PropsWithChildren } from "react";

export default async function RouteLayout(props: PropsWithChildren) {
  const { locale } = await getI18n();
  const isEnglish = locale === "en";
  return (
    <div className="grid min-h-full bg-[#f6f3ec] lg:grid-cols-[minmax(360px,0.82fr)_minmax(520px,1.18fr)]">
      <aside className="relative hidden overflow-hidden bg-[#155c5a] px-10 py-12 text-[#fff8ed] lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="absolute -top-24 -left-24 size-80 rounded-full bg-[#afc9bc]/20 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-bold tracking-[0.18em] text-[#f3c9a8] uppercase">
            {isEnglish ? "Your continuity journal" : "Ton carnet de continuité"}
          </p>
          <h1 className="mt-4 max-w-md font-[family-name:var(--font-caption)] text-4xl leading-[1.06] font-bold tracking-[-0.035em] xl:text-5xl">
            {isEnglish
              ? "Find the thread, one day at a time."
              : "Retrouve le fil, un jour à la fois."}
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-[#fff8ed]/76">
            {isEnglish
              ? "Less to enter. More to understand. Better prepared for care."
              : "Moins saisir. Mieux comprendre. Mieux se préparer au soin."}
          </p>
        </div>
        <BrandIllustration
          variant="welcome"
          priority
          sizes="(min-width: 1280px) 520px, 40vw"
          className="relative -mx-6 max-h-[54vh] w-[calc(100%+3rem)] object-contain"
        />
        <p className="relative max-w-sm text-xs leading-5 text-[#fff8ed]/75">
          {isEnglish
            ? "Private by design · no diagnosis · no guilt-driven streaks"
            : "Confidentiel par conception · sans diagnostic · sans série culpabilisante"}
        </p>
      </aside>
      <main className="relative flex min-h-full flex-col items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
        <div className="mb-2 flex h-36 w-full max-w-sm items-center justify-center overflow-hidden rounded-[28px] bg-[#155c5a] lg:hidden">
          <BrandIllustration
            variant="welcome"
            priority
            sizes="360px"
            className="h-48 w-auto max-w-none"
          />
        </div>
        {props.children}
      </main>
    </div>
  );
}
