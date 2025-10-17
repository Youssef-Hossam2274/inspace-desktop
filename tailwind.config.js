/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/renderer/**/*.{js,jsx,ts,tsx,html}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          DEFAULT: "#6b7db5",
          light: "#8591c7",
          dark: "#5a6a9e",
          alpha: "rgba(107, 125, 181, 0.1)",
        },
        // Secondary colors
        secondary: {
          DEFAULT: "#7a8396",
          light: "#9099a8",
          dark: "#686e7d",
        },
        // Dark theme backgrounds
        "bg-dark": {
          primary: "#181818",
          secondary: "#141414",
          tertiary: "#1a1a1a",
          quaternary: "#222",
        },
        // Light theme backgrounds
        "bg-light": {
          primary: "#ffffff",
          secondary: "#f9fafb",
          tertiary: "#f3f4f6",
          quaternary: "#e5e7eb",
        },
        // Dark theme text
        "text-dark": {
          primary: "#e0e0e0",
          secondary: "#a0a0a0",
          tertiary: "#6b7280",
          muted: "#7a7a7a",
        },
        // Light theme text
        "text-light": {
          primary: "#111827",
          secondary: "#4b5563",
          tertiary: "#9ca3af",
        },
        // Dark theme borders
        "border-dark": {
          primary: "#2a2a2a",
          secondary: "#3a3a3a",
          tertiary: "#252525",
        },
        // Light theme borders
        "border-light": {
          primary: "#e5e7eb",
          secondary: "#d1d5db",
          tertiary: "#f3f4f6",
        },
        // Status colors
        success: {
          DEFAULT: "#10b981",
          light: "#4ade80",
          bg: "rgba(74, 222, 128, 0.1)",
        },
        error: {
          DEFAULT: "#ef4444",
          dark: "#dc2626",
          bg: "rgba(239, 68, 68, 0.1)",
        },
        warning: {
          DEFAULT: "#f59e0b",
          light: "#facc15",
          bg: "rgba(250, 204, 21, 0.1)",
        },
        info: {
          DEFAULT: "#3b82f6",
          dark: "#2563eb",
          bg: "rgba(59, 130, 246, 0.1)",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          '"Fira Sans"',
          '"Droid Sans"',
          '"Helvetica Neue"',
          "sans-serif",
        ],
        display: [
          '"SF Pro Display"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ],
        mono: [
          '"SF Mono"',
          "Monaco",
          "Inconsolata",
          '"Roboto Mono"',
          '"Source Code Pro"',
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        xs: "0.75rem", // 12px
        sm: "0.875rem", // 14px
        base: "1rem", // 16px
        lg: "1.125rem", // 18px
        xl: "1.25rem", // 20px
        "2xl": "1.5rem", // 24px
        "3xl": "1.875rem", // 30px
        "4xl": "2.25rem", // 36px
        "5xl": "3rem", // 48px
        "6xl": "3.75rem", // 60px
      },
      spacing: {
        0: "0",
        1: "0.25rem", // 4px
        2: "0.5rem", // 8px
        3: "0.75rem", // 12px
        4: "1rem", // 16px
        5: "1.25rem", // 20px
        6: "1.5rem", // 24px
        8: "2rem", // 32px
        10: "2.5rem", // 40px
        12: "3rem", // 48px
        16: "4rem", // 64px
        20: "5rem", // 80px
        24: "6rem", // 96px
        32: "8rem", // 128px
        40: "10rem", // 160px
        48: "12rem", // 192px
        56: "14rem", // 224px
        64: "16rem", // 256px
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
        "sm-dark": "0 1px 2px rgba(0, 0, 0, 0.3)",
        md: "0 4px 6px rgba(0, 0, 0, 0.07)",
        "md-dark": "0 4px 6px rgba(0, 0, 0, 0.4)",
        lg: "0 10px 15px rgba(0, 0, 0, 0.1)",
        "lg-dark": "0 10px 15px rgba(0, 0, 0, 0.5)",
        xl: "0 20px 25px rgba(0, 0, 0, 0.15)",
        "xl-dark": "0 20px 25px rgba(0, 0, 0, 0.6)",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInUp: {
          "0%": { opacity: "0", transform: "translateY(20px) scale(0.8)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        shimmer: {
          "0%": { left: "-100%" },
          "100%": { left: "100%" },
        },
        pulse: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.05)", opacity: "0.8" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.3s ease-out",
        "slide-in-up": "slideInUp 0.3s ease-out",
        shimmer: "shimmer 1.5s infinite",
        pulse: "pulse 1s infinite",
        "fade-in": "fadeIn 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
