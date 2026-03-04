import type { Metadata } from "next";
import { Cormorant_Garamond, Sora } from "next/font/google";
import type { ReactNode } from "react";
import React from "react";

import "./globals.css";

const cormorantGaramond = Cormorant_Garamond({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-serif",
});

const sora = Sora({
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
		<html lang="en" className={`${cormorantGaramond.variable} ${sora.variable} scroll-smooth`}>
			<body className="font-sans antialiased">{children}</body>
		</html>
	);
}
