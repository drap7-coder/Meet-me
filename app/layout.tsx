import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meet Me Halfway",
  description: "Find the perfect place between you.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  icons: {
    icon: "/meet-me-half-way-logo.png",
    apple: "/meet-me-half-way-logo.png"
  },
  openGraph: {
    title: "Meet Me Halfway",
    description: "Find the perfect place between you.",
    type: "website",
    images: ["/meet-me-half-way-logo.png"]
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
