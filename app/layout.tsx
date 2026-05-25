import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Replay Room | Apple Music Library",
  description: "An interactive view of a personal Apple Music library export.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
