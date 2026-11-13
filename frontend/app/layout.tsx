import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

// Geist is self-hosted by next/font at build time and exposed as a CSS variable
// (used by `body` in globals.css).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mental Coach Chat",
  description: "A simple chat UI for the FastAPI mental coach backend.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body>{children}</body>
    </html>
  );
}
