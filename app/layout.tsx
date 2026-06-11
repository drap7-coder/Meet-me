import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { BRAND } from "@/src/config/branding";
import "./globals.css";

export const metadata: Metadata = {
  title: BRAND.name,
  applicationName: BRAND.name,
  description: BRAND.description,
  metadataBase: new URL(BRAND.url),
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
        url: "/halfway-share-logo.png",
        width: 1774,
        height: 887,
        alt: BRAND.name
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.name,
    description: BRAND.description,
    images: ["/halfway-share-logo.png"]
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
