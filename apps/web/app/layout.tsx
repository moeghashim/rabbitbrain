import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import type { ReactNode } from "react";
import React from "react";

import "./globals.css";

const instrumentSerif = Instrument_Serif({
	subsets: ["latin"],
	weight: "400",
	variable: "--font-serif",
});

const manrope = Manrope({
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
		<html lang="en" className={`${instrumentSerif.variable} ${manrope.variable} scroll-smooth`}>
			<body className="antialiased">
				<ClerkProvider>{children}</ClerkProvider>
			</body>
		</html>
	);
}
