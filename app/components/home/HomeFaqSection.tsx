import { HomeFaqAccordion } from "@/app/components/home/HomeFaqAccordion";
import { HOME_FAQ_ITEMS, homeFaqPageJsonLd } from "@/src/config/homeFaq";

/** Server-rendered FAQ — full copy stays in HTML for crawlers; accordion trims the default footprint. */
export function HomeFaqSection() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqPageJsonLd()) }}
      />
      <HomeFaqAccordion items={HOME_FAQ_ITEMS} />
    </>
  );
}
