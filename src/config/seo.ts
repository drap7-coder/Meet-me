export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is Koi?",
    answer:
      "Koi is a natural-language assistant for tonight's plans — restaurants and activities nearby, live events and sports, streaming picks, and fair meetup spots when you're coming from two places."
  },
  {
    question: "How do I find a place halfway between two people?",
    answer:
      "Tell Koi where each person is coming from and what kind of spot you want. Koi recommends places near the midpoint with balanced travel times for both people."
  },
  {
    question: "Can Koi find live events and concerts near me?",
    answer:
      "Yes. Ask for concerts, comedy, sports, or things to do this weekend. Koi surfaces live events near your location, including a trending weekend feed on the homepage when tickets are available."
  },
  {
    question: "Can Koi help me decide what to watch?",
    answer:
      "Yes. Pick Streaming or describe the mood, genre, or title you want. Koi recommends movies and TV picks and can factor in services like Netflix or Max when you mention them."
  },
  {
    question: "What kinds of places can Koi find nearby?",
    answer:
      "Food and drink, nightlife, outdoor spots, activities, thrift stores, museums, parks, farmers markets, and more. Choose Explore on the homepage or just ask in plain language."
  },
  {
    question: "Does Koi compare drive times?",
    answer:
      "Yes, for place searches. Result cards show drive time from each starting point and how balanced the trip is for everyone meeting up."
  },
  {
    question: "Can I search near one location instead of two?",
    answer:
      "Yes. Search near a city, town, address, ZIP code, or your current location."
  }
];

export function faqPageJsonLd(items: FaqItem[] = FAQ_ITEMS) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}
