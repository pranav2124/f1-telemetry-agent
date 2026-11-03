/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pitwall: {
          darker: "#08090b",
          dark: "#0f1115",
          panel: "#161922",
          border: "#232838",
          red: "#e10600",
          cyan: "#00f0ff",
          yellow: "#ffd000"
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace', 'Courier New'],
      }
    },
  },
  plugins: [],
}