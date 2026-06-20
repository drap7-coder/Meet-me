import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { BRAND } from "@/src/config/branding";
import { FAQ_ITEMS } from "@/src/config/seo";
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
    "meet me halfway app",
    "find the best place to meet in the middle",
    "halfway point app",
    "meeting place finder",
    "what to watch tonight",
    "local events finder",
    "movie recommendations",
    "midpoint restaurant finder"
  ],
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
        url: "/branding/koi-logo-horizontal.png",
        width: 940,
        height: 360,
        alt: BRAND.displayName
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.seoTitle,
    description: BRAND.description,
    images: ["/branding/koi-logo-horizontal.png"]
  }
};

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: BRAND.displayName,
  alternateName: ["Koi", "Ask Koi"],
  url: BRAND.url,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  description: BRAND.description,
  image: `${BRAND.url}/branding/koi-logo-horizontal.png`,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD"
  },
  potentialAction: {
    "@type": "SearchAction",
    target: `${BRAND.url}/?a={location_a}&b={location_b}&category=coffee`,
    "query-input": ["required name=location_a", "required name=location_b"]
  }
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer
    }
  }))
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
