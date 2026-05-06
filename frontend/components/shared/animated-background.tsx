export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-mesh-gradient opacity-90" />
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl" />
      <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl" />
    </div>
  );
}
