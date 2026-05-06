"use client";

import Link from "next/link";
import { MapPinned } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/map", label: "Map" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trip-details", label: "Trip" },
  { href: "/profile", label: "Profile" }
];

export function Navbar() {
  return (
    <header className="sticky top-4 z-50 mx-auto w-[min(1120px,95%)]">
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0a0e18]/90 px-4 py-3 shadow-glass backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-sky-200">
          <MapPinned className="h-5 w-5" />
          GMap AI
        </Link>
        <nav className="hidden gap-5 text-sm text-slate-300 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-sky-300">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button size="sm" variant="ghost" asChild>
            <Link href="/map">Live map</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
