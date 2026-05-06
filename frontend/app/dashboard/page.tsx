"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getWeather, optimizeRoute } from "@/lib/api-client";

export default function DashboardPage() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [weatherError, setWeatherError] = useState("");
  const [distance, setDistance] = useState("");
  const [eta, setEta] = useState("");
  const [weatherLine, setWeatherLine] = useState("");

  const loadLive = useCallback(async () => {
    if (!source.trim() || !destination.trim()) {
      setRouteError("Enter both origin and destination.");
      return;
    }
    setLoading(true);
    setRouteError("");
    setWeatherError("");
    setDistance("");
    setEta("");
    setWeatherLine("");

    const [routeResult, weatherResult] = await Promise.allSettled([
      optimizeRoute({ source, destination }),
      getWeather(source, destination)
    ]);

    if (routeResult.status === "fulfilled") {
      const routeData = routeResult.value;
      const legs = routeData.raw.routes?.[0]?.legs ?? [];
      const totalMeters = legs.reduce((sum, leg) => sum + (leg.distance?.value ?? 0), 0);
      const totalSeconds = legs.reduce((sum, leg) => sum + (leg.duration?.value ?? 0), 0);
      setDistance(totalMeters > 0 ? `${(totalMeters / 1000).toFixed(1)} km` : "—");
      setEta(totalSeconds > 0 ? `${(totalSeconds / 3600).toFixed(1)} h` : "—");
    } else {
      setDistance("—");
      setEta("—");
      setRouteError(routeResult.reason instanceof Error ? routeResult.reason.message : "Route unavailable.");
    }

    if (weatherResult.status === "fulfilled") {
      const weatherData = weatherResult.value;
      const dest = weatherData.destination_forecast?.[0];
      const src = weatherData.source_forecast?.[0];
      const parts: string[] = [];
      if (src?.city && src.condition && typeof src.temperature_c === "number") {
        parts.push(`${src.city}: ${src.condition}, ${Math.round(src.temperature_c)} °C`);
      }
      if (dest?.city && dest.condition && typeof dest.temperature_c === "number") {
        parts.push(`${dest.city}: ${dest.condition}, ${Math.round(dest.temperature_c)} °C`);
      }
      setWeatherLine(parts.join(" · ") || "—");
    } else {
      setWeatherLine("—");
      setWeatherError(weatherResult.reason instanceof Error ? weatherResult.reason.message : "Weather failed.");
    }

    setLoading(false);
  }, [destination, source]);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-400">
          Route and weather load independently—forecast can appear even if Directions is still failing.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-4 text-sm font-medium text-slate-200">Quick live check</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Origin</label>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm outline-none"
                placeholder="e.g. Bengaluru"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Destination</label>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm outline-none"
                placeholder="e.g. Goa"
              />
            </div>
          </div>
          <Button className="mt-4" type="button" disabled={loading} onClick={() => void loadLive()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : (
              "Load live route & weather"
            )}
          </Button>
          {routeError ? (
            <p className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/95">
              <span className="font-medium">Directions:</span> {routeError}
            </p>
          ) : null}
          {weatherError ? <p className="mt-3 text-sm text-rose-300">{weatherError}</p> : null}

          {!loading && (weatherLine !== "" || distance !== "" || eta !== "") ? (
            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <dt className="text-xs text-slate-500">Distance</dt>
                <dd className="font-medium text-slate-100">{distance || "—"}</dd>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <dt className="text-xs text-slate-500">Drive time</dt>
                <dd className="font-medium text-slate-100">{eta || "—"}</dd>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 sm:col-span-3">
                <dt className="text-xs text-slate-500">Next forecast snapshot</dt>
                <dd className="font-medium text-slate-100">{weatherLine || "—"}</dd>
              </div>
            </dl>
          ) : null}
        </div>

        <aside className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
          <div>
            <p className="font-medium text-slate-200">Map view</p>
            <p className="mt-2 leading-relaxed">Same live APIs as here—the map draws the route when Directions succeeds.</p>
          </div>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/map">Open map</Link>
          </Button>
        </aside>
      </div>
    </section>
  );
}
