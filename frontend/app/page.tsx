import Link from "next/link";
import { Compass, MapPinned, Sparkles, ThermometerSun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { FeatureGrid } from "@/components/shared/feature-grid";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="glass relative overflow-hidden rounded-2xl border border-white/10 p-6 md:p-10">
        <AnimatedBackground />
        <div className="relative grid items-center gap-8 md:grid-cols-[1fr_min(320px,100%)]">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1 text-xs text-sky-200">
              <Sparkles className="h-3.5 w-3.5" />
              Live maps, weather, and Gemini planning
            </span>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              Plan road trips with live data
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-400 md:text-base">
              Open the map for forecasts and routing, or Trip for a Gemini-built itinerary. Each page pulls from your
              backend APIs when you run it.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/map">Open live map</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/chat">Chat with Gemini</Link>
              </Button>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-5 md:min-h-[200px]">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">What you can do</p>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex gap-3">
                <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
                <span>
                  <span className="font-medium text-slate-100">Map</span> — weather plus route line when Google
                  Directions succeeds.
                </span>
              </li>
              <li className="flex gap-3">
                <ThermometerSun className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
                <span>
                  <span className="font-medium text-slate-100">Dashboard</span> — quick distance & forecast check for
                  any two cities.
                </span>
              </li>
              <li className="flex gap-3">
                <Compass className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
                <span>
                  <span className="font-medium text-slate-100">Trip</span> — day-by-day plan from Gemini.
                </span>
              </li>
            </ul>
            <Button variant="outline" size="sm" className="w-full border-white/15" asChild>
              <Link href="/trip-details">Plan a trip</Link>
            </Button>
          </div>
        </div>
      </section>

      <FeatureGrid />
    </div>
  );
}
