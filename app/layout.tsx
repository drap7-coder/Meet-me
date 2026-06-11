import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { BRAND } from "@/src/config/branding";
import "./globals.css";

export const metadata: Metadata = {
  title: BRAND.name,
  applicationName: BRAND.name,
  description: BRAND.description,
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  icons: {
    icon: "/icon",
    apple: "/apple-icon"
  },
  openGraph: {
    title: BRAND.name,
    description: BRAND.description,
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: BRAND.name
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.name,
    description: BRAND.description,
    images: ["/opengraph-image"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
