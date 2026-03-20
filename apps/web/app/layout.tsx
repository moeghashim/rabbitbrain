import type { Metadata } from "next";
import { Inter, Noto_Serif, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import React from "react";

import { AgentationDevtools } from "../components/agentation-devtools.js";
import "./globals.css";

const notoSerif = Noto_Serif({
	subsets: ["latin"],
	weight: ["400", "700"],
	variable: "--font-headline",
});

const inter = Inter({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-body",
});

const spaceGrotesk = Space_Grotesk({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-label",
});

export const metadata: Metadata = {
	title: "Rabbit Brain | Obsidian Signal Studio",
	description: "Transform X signals into structured intelligence with a brutalist editorial interface.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<html lang="en" className={`${notoSerif.variable} ${inter.variable} ${spaceGrotesk.variable} scroll-smooth`}>
			<body className="font-body antialiased">
				{children}
				<AgentationDevtools />
			</body>
		</html>
	);
}
