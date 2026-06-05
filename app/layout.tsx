import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meet Me Halfway",
  description: "Find the perfect place between you.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  icons: {
    icon: "/meet-me-logo-v3.png",
    apple: "/meet-me-logo-v3.png"
  },
  openGraph: {
    title: "Meet Me Halfway",
    description: "Find the perfect place between you.",
    type: "website",
    images: [
      {
        url: "/meet-me-logo-v3.png",
        width: 1254,
        height: 1254,
        alt: "Meet Me Halfway"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Meet Me Halfway",
    description: "Find the perfect place between you.",
    images: ["/meet-me-logo-v3.png"]
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
