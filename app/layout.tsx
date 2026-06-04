import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meet Me Half Way",
  description: "Find the fairest place to meet.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "Meet Me Half Way",
    description: "Find the fairest place to meet.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
