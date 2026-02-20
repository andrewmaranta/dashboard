/** @type {import('tailwindcss').Config} */
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        cozy: {
          bg: "var(--cozy-bg)",
          "bg-alt": "var(--cozy-bg-alt)",
          panel: "var(--cozy-panel)",
          text: "var(--cozy-text)",
          "text-dark": "var(--cozy-text-dark)",
          "text-muted": "var(--cozy-text-muted)",
          "text-dim": "var(--cozy-text-dim)",
          accent: "var(--cozy-accent)",
          "accent-dark": "var(--cozy-accent-dark)",
          "accent-soft": "var(--cozy-accent-soft)",
          warm: "var(--cozy-warm)",
          gold: "var(--cozy-gold)",
          border: "var(--cozy-border)",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pop": "pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "float": "float 6s ease-in-out infinite",
        "blur-in": "blur-in 0.8s ease-out forwards",
        "wiggle": "wiggle 0.3s ease-in-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
