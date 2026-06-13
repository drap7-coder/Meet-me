import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BRAND } from "@/src/config/branding";
import { FAQ_ITEMS } from "@/src/config/seo";
import "./globals.css";

export const metadata: Metadata = {
  title: BRAND.seoTitle,
  applicationName: BRAND.name,
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
    "midpoint restaurant finder",
    "fair meeting place"
  ],
  icons: {
    icon: "/icon",
    apple: "/apple-icon"
  },
  openGraph: {
    title: BRAND.seoTitle,
    description: BRAND.description,
    url: BRAND.url,
    siteName: BRAND.name,
    type: "website",
    images: [
      {
        url: "/halfway-hero-logo.png",
        width: 1774,
        height: 887,
        alt: BRAND.name
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.seoTitle,
    description: BRAND.description,
    images: ["/halfway-hero-logo.png"]
  }
};

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Meet Me Halfway App",
  alternateName: BRAND.name,
  url: BRAND.url,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  description: BRAND.description,
  image: `${BRAND.url}/halfway-hero-logo.png`,
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
        <SpeedInsights />
      </body>
    </html>
  );
}
