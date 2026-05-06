"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-9 rounded-lg border border-white/15 bg-white/5" />;
  }

  const isDark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-lg border border-white/20 bg-white/5 p-2 transition hover:bg-white/10"
      aria-label="Toggle color theme"
    >
      {isDark ? <Sun className="h-4 w-4 text-sky-200" /> : <Moon className="h-4 w-4 text-indigo-600" />}
    </button>
  );
}
