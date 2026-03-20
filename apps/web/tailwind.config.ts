import type { Config } from "tailwindcss";

const config: Config = {
	content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
	theme: {
		extend: {
			colors: {
				coral: {
					DEFAULT: "#EF4623",
					hover: "#D83A1A",
				},
				ink: {
					DEFAULT: "#2D3B42",
					dark: "#1C262B",
					light: "#3E4D55",
				},
				peach: "#FDF1EE",
				charcoal: "#222D33",
				background: "#131313",
				surface: "#131313",
				"surface-dim": "#131313",
				"surface-bright": "#3A3939",
				"surface-container-lowest": "#0E0E0E",
				"surface-container-low": "#1C1B1B",
				"surface-container": "#201F1F",
				"surface-container-high": "#2A2A2A",
				"surface-container-highest": "#353534",
				"surface-variant": "#353534",
				primary: "#6EE591",
				"primary-container": "#50C878",
				"on-primary-container": "#005025",
				secondary: "#C6C6C6",
				"on-surface": "#E5E2E1",
				"on-surface-variant": "#BDCABC",
				outline: "#879487",
				"outline-variant": "#3E4A3F",
			},
			fontFamily: {
				headline: ["var(--font-headline)", "serif"],
				body: ["var(--font-body)", "sans-serif"],
				label: ["var(--font-label)", "sans-serif"],
				mono: ["var(--font-mono)", "monospace"],
				serif: ["var(--font-headline)", "serif"],
				sans: ["var(--font-body)", "sans-serif"],
			},
			borderRadius: {
				DEFAULT: "0px",
				"4xl": "24px",
				"5xl": "48px",
			},
			transitionTimingFunction: {
				redsun: "cubic-bezier(0.16, 1, 0.3, 1)",
			},
			backgroundImage: {
				"dot-pattern": "radial-gradient(rgba(253, 241, 238, 0.2) 2px, transparent 2px)",
			},
			animation: {
				"pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
				float: "float 6s ease-in-out infinite",
			},
			keyframes: {
				float: {
					"0%, 100%": { transform: "translateY(0)" },
					"50%": { transform: "translateY(-10px)" },
				},
			},
		},
	},
	plugins: [],
};

export default config;
