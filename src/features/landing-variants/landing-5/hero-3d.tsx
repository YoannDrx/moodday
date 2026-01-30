"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { FloatingShapes } from "./floating-shapes";
import { ParallaxLayer } from "../shared";

export function Hero3D() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#F8F7F3] to-white">
      <FloatingShapes />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 py-32">
        {/* Badge with parallax */}
        <ParallaxLayer speed={0.1}>
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#2BA09F]/20 bg-white/80 px-5 py-2.5 shadow-lg backdrop-blur-sm">
            <Sparkles className="size-4 text-[#2BA09F]" />
            <span className="text-sm font-medium text-gray-700">
              Découvrez une nouvelle approche
            </span>
          </div>
        </ParallaxLayer>

        {/* Title with depth effect */}
        <ParallaxLayer speed={0.2}>
          <h1 className="mb-6 text-center text-5xl font-bold tracking-tight text-gray-900 text-shadow-lg md:text-6xl lg:text-7xl">
            Votre santé mentale
            <br />
            <span className="animate-gradient bg-gradient-to-r from-[#2BA09F] via-[#48A878] to-[#2BA09F] bg-[length:200%_auto] bg-clip-text text-transparent">
              en 3 dimensions
            </span>
          </h1>
        </ParallaxLayer>

        {/* Subtitle */}
        <ParallaxLayer speed={0.3}>
          <p className="mb-10 max-w-2xl text-center text-lg text-gray-600 md:text-xl">
            Une expérience immersive pour comprendre vos émotions, suivre vos
            traitements et partager avec ceux qui comptent.
          </p>
        </ParallaxLayer>

        {/* CTAs */}
        <ParallaxLayer speed={0.4}>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/auth/signup"
              className={cn(
                buttonVariants({ size: "lg" }),
                "hover-glow-primary gap-2 rounded-2xl px-8 shadow-xl transition-all duration-300 hover:scale-105",
              )}
            >
              Explorer maintenant
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#features"
              className="group flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-semibold text-gray-700 shadow-lg transition-all hover:shadow-xl"
            >
              Voir les fonctionnalités
            </Link>
          </div>
        </ParallaxLayer>

        {/* 3D Mockup preview */}
        <ParallaxLayer speed={0.15} className="mt-16 w-full max-w-4xl">
          <div className="perspective-1000 relative">
            <div
              className="preserve-3d rounded-3xl border border-gray-200 bg-white p-2 shadow-2xl transition-transform duration-700 hover:shadow-[0_50px_100px_-20px_rgba(43,160,159,0.3)]"
              style={{ transform: "rotateX(5deg)" }}
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-2 rounded-t-2xl bg-gray-50 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-red-400" />
                  <div className="size-3 rounded-full bg-yellow-400" />
                  <div className="size-3 rounded-full bg-green-400" />
                </div>
                <div className="ml-4 flex-1 rounded-lg bg-gray-200 px-4 py-1 text-center text-sm text-gray-500">
                  app.moodday.io
                </div>
              </div>

              {/* Dashboard preview */}
              <div className="rounded-b-2xl bg-[#F8F7F3] p-6">
                <div className="grid grid-cols-3 gap-4">
                  {/* Mood card */}
                  <div className="col-span-2 rounded-2xl bg-gradient-to-br from-[#2BA09F] to-[#48A878] p-6 text-white">
                    <p className="mb-2 text-sm opacity-80">Humeur du jour</p>
                    <div className="flex items-end justify-between">
                      <span className="text-4xl font-bold">7.8</span>
                      <span className="text-4xl">😊</span>
                    </div>
                  </div>

                  {/* Stats card */}
                  <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <p className="mb-2 text-sm text-gray-500">Adhérence</p>
                    <p className="text-3xl font-bold text-[#48A878]">98%</p>
                  </div>

                  {/* Chart placeholder */}
                  <div className="col-span-3 flex h-32 items-end gap-2 rounded-2xl bg-white p-4 shadow-sm">
                    {[40, 55, 45, 70, 65, 80, 75, 68, 85, 72].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-[#2BA09F] to-[#48A878] opacity-80"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ParallaxLayer>
      </div>
    </section>
  );
}
