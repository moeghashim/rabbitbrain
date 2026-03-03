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
			},
			fontFamily: {
				serif: ["var(--font-serif)", "serif"],
				sans: ["var(--font-sans)", "sans-serif"],
			},
			borderRadius: {
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
