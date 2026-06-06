import type { Metadata } from "next";
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
        url: "/icon",
        width: 512,
        height: 512,
        alt: BRAND.name
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.name,
    description: BRAND.description,
    images: ["/icon"]
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
