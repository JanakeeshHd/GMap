"use client";

import Link from "next/link";
import { IndianRupee, Route, Sparkles } from "lucide-react";

export default function ProfilePage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-slate-400">No mock saved trips—use Trip or Map for live-backed flows.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
            <Sparkles className="h-4 w-4 text-sky-400" />
            Next steps
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Generate a Gemini itinerary on the Trip page, or open the Map for live Directions and weather. Saved
            history can be wired to your API when you add a list endpoint.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/trip-details"
              className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-slate-200 hover:border-white/20"
            >
              Trip planner
            </Link>
            <Link
              href="/map"
              className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-slate-200 hover:border-white/20"
            >
              Live map
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-3 text-sm font-medium text-slate-200">Preference hints (local only)</h2>
          <div className="grid gap-3 text-sm text-slate-400">
            <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <IndianRupee className="mt-0.5 h-4 w-4 text-sky-400" />
              <span>Budget and style are sent with each Trip request—nothing stored here yet.</span>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <Route className="mt-0.5 h-4 w-4 text-sky-400" />
              <span>Route shape on the map always comes from Google Directions for your current inputs.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
