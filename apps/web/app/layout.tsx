import type { Metadata } from "next";
import { Newsreader, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import React from "react";

import "./globals.css";

const newsreader = Newsreader({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-serif",
});

const spaceGrotesk = Space_Grotesk({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-sans",
});

export const metadata: Metadata = {
	title: "Red Sun | Editorial SaaS",
	description: "Transform raw thoughts into compelling narratives with editorial precision.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<html lang="en" className={`${newsreader.variable} ${spaceGrotesk.variable} scroll-smooth`}>
			<body className="font-sans antialiased">{children}</body>
		</html>
	);
}
