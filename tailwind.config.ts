import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "hsl(222, 47%, 11%)",
                foreground: "hsl(213, 31%, 91%)",
                primary: {
                    DEFAULT: "hsl(142, 71%, 45%)",
                    dark: "hsl(142, 71%, 35%)",
                },
                secondary: {
                    DEFAULT: "hsl(160, 84%, 39%)",
                    dark: "hsl(160, 84%, 29%)",
                },
                accent: {
                    DEFAULT: "hsl(340, 82%, 62%)",
                    dark: "hsl(340, 82%, 52%)",
                },
                card: "hsl(222, 47%, 15%)",
                "card-hover": "hsl(222, 47%, 18%)",
                border: "hsl(160, 20%, 25%)",
            },
            fontFamily: {
                sans: ["var(--font-inter)", "system-ui", "sans-serif"],
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "gradient-primary": "linear-gradient(135deg, hsl(142, 71%, 45%), hsl(160, 84%, 39%))",
                "gradient-accent": "linear-gradient(135deg, hsl(340, 82%, 62%), hsl(142, 71%, 45%))",
            },
            boxShadow: {
                "premium-hover": "0 20px 50px rgba(0, 0, 0, 0.3)",
                "primary-glow": "0 4px 15px rgba(34, 197, 94, 0.2)",
                "primary-glow-hover": "0 8px 25px rgba(34, 197, 94, 0.4)",
            }
        },
    },
    plugins: [],
};
export default config;
