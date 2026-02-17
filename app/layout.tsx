import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rabbitbrain",
  description: "Analyze X posts and save recommendations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="rb-noise-overlay" aria-hidden />
        {children}
      </body>
    </html>
  );
}
