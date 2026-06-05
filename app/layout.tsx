import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meet Me Halfway",
  description: "Find the perfect place between you.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  icons: {
    icon: "/icon?brand=halfway-v2",
    apple: "/apple-icon?brand=halfway-v2"
  },
  openGraph: {
    title: "Meet Me Halfway",
    description: "Find the perfect place between you.",
    type: "website",
    images: [
      {
        url: "/opengraph-image?brand=halfway-v2",
        width: 1200,
        height: 630,
        alt: "Meet Me Halfway"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Meet Me Halfway",
    description: "Find the perfect place between you.",
    images: ["/opengraph-image?brand=halfway-v2"]
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
