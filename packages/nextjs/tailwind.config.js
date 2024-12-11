/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./utils/**/*.{js,ts,jsx,tsx}"],
  plugins: [require("daisyui")],
  darkTheme: "dark",
  darkMode: ["selector", "[data-theme='dark']"],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#00F6FF",
          "primary-content": "#1A1B26",
          secondary: "#7DF9FF",
          "secondary-content": "#1A1B26",
          accent: "#36F1CD",
          "accent-content": "#1A1B26",
          neutral: "#1A1B26",
          "neutral-content": "#ffffff",
          "base-100": "#ffffff",
          "base-200": "#F0F9FF",
          "base-300": "#E0F7FF",
          "base-content": "#1A1B26",
          info: "#00F6FF",
          success: "#36F1CD",
          warning: "#FFB86C",
          error: "#FF5555",
          "--rounded-btn": "0.5rem",
          ".tooltip": { "--tooltip-tail": "6px" },
          ".link": { textUnderlineOffset: "2px" },
          ".link:hover": { opacity: "80%" },
        },
      },
      {
        dark: {
          primary: "#00B8BF",
          "primary-content": "#FFFFFF",
          secondary: "#5BC0C5",
          "secondary-content": "#FFFFFF",
          accent: "#2BC4A3",
          "accent-content": "#FFFFFF",
          neutral: "#F9FBFF",
          "neutral-content": "#FFFFFF",
          "base-100": "#1A1B26",
          "base-200": "#13141F",
          "base-300": "#0D0E14",
          "base-content": "#E0F7FF",
          info: "#00B8BF",
          success: "#2BC4A3",
          warning: "#FFB86C",
          error: "#FF5555",
          "--rounded-btn": "0.5rem",
          ".tooltip": { "--tooltip-tail": "6px", "--tooltip-color": "oklch(var(--p))" },
          ".link": { textUnderlineOffset: "2px" },
          ".link:hover": { opacity: "80%" },
        },
      },
    ],
  },
  theme: {
    extend: {
      boxShadow: {
        center: "0 0 12px -2px rgb(0 0 0 / 0.05)",
        neon: "0 0 5px theme('colors.primary.DEFAULT'), 0 0 20px theme('colors.primary.DEFAULT')",
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "from": { textShadow: "0 0 10px #00F6FF, 0 0 20px #00F6FF, 0 0 30px #00F6FF" },
          "to": { textShadow: "0 0 20px #7DF9FF, 0 0 30px #7DF9FF, 0 0 40px #7DF9FF" }
        }
      }
    },
  },
};
