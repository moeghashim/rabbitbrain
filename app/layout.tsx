import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rabbitbrain",
  description: "Classify shared X posts into learning topics"
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
