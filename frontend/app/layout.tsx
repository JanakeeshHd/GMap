import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "mapbox-gl/dist/mapbox-gl.css";

import "@/app/globals.css";
import { Navbar } from "@/components/layout/navbar";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-poppins" });

export const metadata: Metadata = {
  title: "GMap AI - Smart Roadtrip Assistant",
  description: "Plan intelligent road trips with a futuristic AI travel assistant."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <body>
        <ThemeProvider>
          <Navbar />
          <main className="relative mx-auto w-[min(1120px,95%)] pb-10 pt-8">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
