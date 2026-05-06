import { Bot, Route, ShieldCheck, WifiOff } from "lucide-react";

const features = [
  {
    title: "Live route optimization",
    text: "Directions from Google Maps using your origin, destination, and optional waypoints.",
    icon: Route
  },
  {
    title: "Risk-aware planning",
    text: "Gemini reasons over your preferences; pair it with live weather on the map view.",
    icon: ShieldCheck
  },
  {
    title: "Works with low signal",
    text: "Save context in your flow; refresh when you are back online for updated forecasts.",
    icon: WifiOff
  },
  {
    title: "Gemini copilot",
    text: "Streaming answers from Google Gemini—default model tuned for travel Q&A.",
    icon: Bot
  }
];

export function FeatureGrid() {
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {features.map((item) => (
        <article
          key={item.title}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/15 hover:bg-white/[0.05]"
        >
          <item.icon className="mb-3 h-5 w-5 text-sky-400" />
          <h3 className="mb-1 text-base font-semibold">{item.title}</h3>
          <p className="text-sm leading-relaxed text-slate-400">{item.text}</p>
        </article>
      ))}
    </section>
  );
}
