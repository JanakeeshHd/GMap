"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CloudSun, Gauge, Navigation2 } from "lucide-react";
import { RouteMap } from "@/components/map/route-map";
import { decodeGooglePolyline } from "@/lib/decode-polyline";
import { getWeather, optimizeRoute, recommendPlaces } from "@/lib/api-client";
import type { DirectionStep } from "@/lib/types";

type LatLng = { lat: number; lng: number };

export default function MapPage() {
  const [source, setSource] = useState("Bangalore");
  const [destination, setDestination] = useState("Goa");
  const [loading, setLoading] = useState(true);
  const [routeError, setRouteError] = useState("");
  const [placesError, setPlacesError] = useState("");
  const [weatherError, setWeatherError] = useState("");
  const [distance, setDistance] = useState("—");
  const [eta, setEta] = useState("—");
  const [fuelAndTolls, setFuelAndTolls] = useState("—");
  const [weather, setWeather] = useState("—");
  const [topStops, setTopStops] = useState<string[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [lineCoords, setLineCoords] = useState<[number, number][]>([]);
  const [startPt, setStartPt] = useState<LatLng | null>(null);
  const [endPt, setEndPt] = useState<LatLng | null>(null);
  const [routeProvider, setRouteProvider] = useState("");
  const [directionSteps, setDirectionSteps] = useState<DirectionStep[]>([]);

  const canFetch = useMemo(() => source.trim() && destination.trim(), [source, destination]);

  const refresh = useCallback(async () => {
    if (!canFetch) return;
    setLoading(true);
    setRouteError("");
    setPlacesError("");
    setWeatherError("");

    const [routeResult, weatherResult, placesResult] = await Promise.allSettled([
      optimizeRoute({ source, destination }),
      getWeather(source, destination),
      recommendPlaces({ location: destination, interests: ["tourist_attraction", "food"], budget: "medium" })
    ]);

    if (routeResult.status === "fulfilled") {
      const routeData = routeResult.value;
      setRouteProvider(routeData.provider || "");
      setDirectionSteps(routeData.steps ?? []);

      const route = routeData.raw.routes?.[0];
      const direct = route?.coordinates_lnglat;
      if (direct && direct.length >= 2) {
        setLineCoords(direct.map(([lng, lat]) => [lng, lat] as [number, number]));
      } else {
        const encoded = route?.overview_polyline?.points;
        if (encoded && typeof encoded === "string") {
          setLineCoords(decodeGooglePolyline(encoded));
        } else {
          setLineCoords([]);
        }
      }

      const legs = route?.legs ?? [];
      if (legs.length > 0) {
        const s = legs[0].start_location;
        const e = legs[legs.length - 1].end_location;
        if (s && typeof s.lat === "number" && typeof s.lng === "number") {
          setStartPt({ lat: s.lat, lng: s.lng });
        } else {
          setStartPt(null);
        }
        if (e && typeof e.lat === "number" && typeof e.lng === "number") {
          setEndPt({ lat: e.lat, lng: e.lng });
        } else {
          setEndPt(null);
        }
      } else {
        setStartPt(null);
        setEndPt(null);
      }

      const totalMeters = legs.reduce((sum, leg) => sum + (leg.distance?.value ?? 0), 0);
      const totalSeconds = legs.reduce((sum, leg) => sum + (leg.duration?.value ?? 0), 0);

      const km = totalMeters > 0 ? `${(totalMeters / 1000).toFixed(1)} km` : "—";
      const hrs = totalSeconds > 0 ? `${(totalSeconds / 3600).toFixed(1)} h` : "—";
      setDistance(km);
      setEta(hrs);
      if (totalMeters > 0) {
        const estimate = Math.round((totalMeters / 1000) * 6.5);
        setFuelAndTolls(`Rs. ${estimate.toLocaleString("en-IN")}`);
      } else {
        setFuelAndTolls("—");
      }
    } else {
      setRouteProvider("");
      setDirectionSteps([]);
      setLineCoords([]);
      setStartPt(null);
      setEndPt(null);
      setDistance("—");
      setEta("—");
      setFuelAndTolls("—");
      setRouteError(routeResult.reason instanceof Error ? routeResult.reason.message : "Route unavailable.");
    }

    if (weatherResult.status === "fulfilled") {
      const weatherData = weatherResult.value;
      const nextWeather = weatherData.destination_forecast?.[0];
      if (nextWeather?.condition && typeof nextWeather.temperature_c === "number") {
        setWeather(`${nextWeather.condition}, ${Math.round(nextWeather.temperature_c)} °C`);
      } else {
        setWeather("—");
      }
    } else {
      setWeather("—");
      setWeatherError(weatherResult.reason instanceof Error ? weatherResult.reason.message : "Weather unavailable.");
    }

    if (placesResult.status === "fulfilled") {
      const placesData = placesResult.value;
      const places = placesData.recommendations
        .slice(0, 3)
        .map((place) => place.name)
        .filter((name): name is string => Boolean(name));
      setTopStops(places);
    } else {
      setTopStops([]);
      setPlacesError(placesResult.reason instanceof Error ? placesResult.reason.message : "Places unavailable.");
    }

    setUpdatedAt(new Date().toLocaleTimeString());
    setLoading(false);
  }, [canFetch, destination, source]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const routeOk = !routeError && lineCoords.length >= 2;

  return (
    <section className="h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-white/10 bg-[#070a12]">
      <div className="grid h-full lg:grid-cols-[300px_1fr]">
        <aside className="m-3 flex max-h-[calc(100vh-10rem)] flex-col overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h1 className="text-lg font-semibold tracking-tight">Live trip monitor</h1>
          <p className="mb-4 text-xs leading-relaxed text-slate-400">
            Weather loads even if Google Directions or Places returns an error—check notices below.
          </p>
          <div className="mb-3 space-y-2">
            <label className="block text-xs text-slate-500">Origin</label>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:ring-2"
              placeholder="Source"
            />
            <label className="mt-2 block text-xs text-slate-500">Destination</label>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:ring-2"
              placeholder="Destination"
            />
          </div>
          <div className="space-y-2 text-sm">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-slate-200">
              ETA: <span className="text-slate-400">{eta}</span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-slate-200">
              Distance: <span className="text-slate-400">{distance}</span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-slate-200">
              Fuel + tolls (est.): <span className="text-slate-400">{fuelAndTolls}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading || !canFetch}
            className="mt-4 w-full rounded-lg border border-sky-500/30 bg-sky-500/15 px-3 py-2.5 text-sm font-medium text-sky-100 transition hover:bg-sky-500/25 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh live data"}
          </button>
          {updatedAt ? <p className="mt-2 text-xs text-slate-500">Updated {updatedAt}</p> : null}
          {routeError ? (
            <p className="mt-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-2 text-[11px] leading-snug text-amber-100/95">
              <span className="font-medium">Directions:</span> {routeError}
            </p>
          ) : null}
          {placesError ? (
            <p className="mt-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-2 text-[11px] leading-snug text-amber-100/95">
              <span className="font-medium">Places:</span> {placesError}
            </p>
          ) : null}
          {weatherError ? (
            <p className="mt-2 text-xs text-rose-300">{weatherError}</p>
          ) : null}

          {directionSteps.length > 0 ? (
            <div className="mt-4 border-t border-white/10 pt-3">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Turn-by-turn
              </h2>
              <ol className="max-h-[40vh] list-decimal space-y-2 overflow-y-auto pl-4 text-[11px] leading-snug text-slate-300">
                {directionSteps.map((s, i) => (
                  <li key={s.step ?? i} className="marker:text-sky-400">
                    <span>{s.text}</span>
                    {s.distance_m != null && s.distance_m > 0 ? (
                      <span className="ml-1 text-slate-500">({Math.round(s.distance_m / 100) / 10} km)</span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          ) : routeOk ? (
            <p className="mt-4 text-[11px] text-slate-500">No step list for this route response.</p>
          ) : null}
        </aside>

        <div className="relative min-h-[280px] p-3 lg:min-h-0">
          <RouteMap coordinates={lineCoords} start={startPt} end={endPt} />
          <div className="pointer-events-none absolute bottom-4 right-4 grid max-w-[min(100%,320px)] gap-2 text-left">
            <div className="pointer-events-auto rounded-lg border border-white/10 bg-[#0a0e18]/90 px-3 py-2 text-xs text-slate-200 backdrop-blur">
              <span className="inline-flex items-center gap-2">
                <CloudSun className="h-4 w-4 shrink-0 text-sky-400" />
                {loading ? "Weather: loading…" : `Weather: ${weather}`}
              </span>
            </div>
            <div className="pointer-events-auto rounded-lg border border-white/10 bg-[#0a0e18]/90 px-3 py-2 text-xs text-slate-200 backdrop-blur">
              <span className="inline-flex items-center gap-2">
                <Gauge className="h-4 w-4 shrink-0 text-sky-400" />
                {loading
                  ? "Route: loading…"
                  : routeOk
                    ? `Route: ${routeProvider === "openrouteservice" ? "OpenRouteService" : routeProvider === "google_maps" ? "Google" : routeProvider}`
                    : "Route: not drawn (see sidebar)"}
              </span>
            </div>
            <div className="pointer-events-auto rounded-lg border border-white/10 bg-[#0a0e18]/90 px-3 py-2 text-xs text-slate-200 backdrop-blur">
              <span className="inline-flex items-center gap-2">
                <Navigation2 className="h-4 w-4 shrink-0 text-sky-400" />
                {topStops.length > 0 ? `Top pick: ${topStops[0]}` : "Places: —"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
