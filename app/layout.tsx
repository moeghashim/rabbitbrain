import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rabbitbrain",
  description: "Save and revisit shared X posts"
};

export default function RootLayout({
  children
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
