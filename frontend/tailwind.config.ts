import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px"
      }
    },
    extend: {
      colors: {
        background: "#080B14",
        foreground: "#E8ECF8",
        panel: "rgba(255,255,255,0.07)",
        border: "rgba(255,255,255,0.14)",
        glow: "#55C0FF",
        violet: "#8B5CF6"
      },
      fontFamily: {
        sans: ["Inter", "Poppins", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glass: "0 0 0 1px rgba(255,255,255,0.14), 0 12px 40px rgba(0,0,0,0.35)",
        glow: "0 0 35px rgba(85,192,255,0.35)"
      },
      backgroundImage: {
        "mesh-gradient":
          "radial-gradient(circle at 20% 20%, rgba(98, 153, 255, 0.25), transparent 35%), radial-gradient(circle at 80% 0%, rgba(139, 92, 246, 0.22), transparent 35%), radial-gradient(circle at 60% 80%, rgba(56, 189, 248, 0.2), transparent 40%)"
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        pulseGlow: "pulseGlow 2.4s ease-in-out infinite"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 18px rgba(85,192,255,0.25)" },
          "50%": { boxShadow: "0 0 34px rgba(85,192,255,0.42)" }
        }
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
