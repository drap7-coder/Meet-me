import { FAQ_ITEMS, faqPageJsonLd } from "../src/config/seo";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const jsonLd = faqPageJsonLd();
assert(jsonLd["@type"] === "FAQPage", "FAQPage type");
assert(Array.isArray(jsonLd.mainEntity), "mainEntity array");
assert(jsonLd.mainEntity.length === FAQ_ITEMS.length, "one schema entity per FAQ");
assert(jsonLd.mainEntity[0]?.["@type"] === "Question", "question entity");
assert(jsonLd.mainEntity[0]?.acceptedAnswer?.["@type"] === "Answer", "answer entity");
assert(FAQ_ITEMS.some((item) => /live events/i.test(item.question)), "includes live events FAQ");

console.log("PASS seo faq schema");
