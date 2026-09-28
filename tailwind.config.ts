import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // "Olive & Stone" — deep olive green, warm stone and a terracotta
      // accent. Token names are kept from the previous theme so every page
      // picks up the new palette without being touched:
      //   cobalt → olive green, porcelain → stone, chalk → cream,
      //   ember → terracotta, char → deep green.
      colors: {
        ink: "#2b302d", // body text — green-black, not literal black
        // Olive green: headings, links, prices, primary buttons.
        cobalt: {
          DEFAULT: "#2f4a42",
          light: "#5f7c72",
          dark: "#1f332d",
        },
        // Warm stone — the header bar, alternating sections, chips.
        porcelain: {
          DEFAULT: "#e6ded4",
          deep: "#d7ccbf",
        },
        // Cream — the base page.
        chalk: {
          DEFAULT: "#f0ebe4",
        },
        // Terracotta — the accent: the main call to action, stars, rules.
        ember: {
          DEFAULT: "#c27b5c",
          light: "#dca286",
          deep: "#9a5a3f",
        },
        // Deep green — dark bands, footer.
        char: {
          DEFAULT: "#1d2c28",
          light: "#2a3c37",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"], // Cormorant Garamond — elegant serif, headings
        script: ["var(--font-script)"], // Cormorant Garamond italic — accent taglines
        body: ["var(--font-body)"], // Inter — clean sans, body/UI
      },
      maxWidth: {
        prose: "68ch",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(31,51,45,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
