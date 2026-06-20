import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { BRAND } from "@/src/config/branding";
import "./globals.css";

export const metadata: Metadata = {
  title: BRAND.seoTitle,
  applicationName: BRAND.displayName,
  description: BRAND.description,
  metadataBase: new URL(BRAND.url),
  alternates: {
    canonical: BRAND.url
  },
  keywords: [
    "places to meet",
    "find a place to meet",
    "meet halfway",
    "halfway between two places",
    "coffee between two locations",
    "restaurants halfway between",
    "meeting place finder",
    "local events near me",
    "concerts near me",
    "what to watch tonight",
    "movie recommendations",
    "streaming recommendations"
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/branding/koi-favicon.png", sizes: "512x512", type: "image/png" }
    ],
    apple: "/branding/koi-app-icon-1024.png"
  },
  openGraph: {
    title: BRAND.seoTitle,
    description: BRAND.description,
    url: BRAND.url,
    siteName: BRAND.displayName,
    type: "website",
    images: [
      {
        url: "/branding/koi-app-icon-1024.png",
        width: 1024,
        height: 1024,
        alt: BRAND.displayName
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.seoTitle,
    description: BRAND.description,
    images: ["/branding/koi-app-icon-1024.png"]
  }
};

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: BRAND.displayName,
  alternateName: ["Ask Koi", "Ask Koi bot", "Koi bot", "Meet halfway app"],
  url: BRAND.url,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  description: BRAND.description,
  image: `${BRAND.url}/branding/koi-app-icon-1024.png`,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD"
  }
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: BRAND.displayName,
  alternateName: ["Ask Koi", "askkoibot.com"],
  url: BRAND.url,
  description: BRAND.description,
  inLanguage: "en-US",
  publisher: {
    "@type": "Organization",
    name: BRAND.displayName,
    url: BRAND.url,
    logo: `${BRAND.url}/branding/koi-app-icon-1024.png`
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
