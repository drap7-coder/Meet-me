export type NeedIdeaItem = {
  id: string;
  label: string;
  query: string;
  featured?: boolean;
};

export const NEED_IDEAS_ITEMS: NeedIdeaItem[] = [
  {
    id: "halfway_restaurants",
    label: "Best restaurants halfway between two locations",
    query: "Best restaurants halfway between two locations",
    featured: true
  },
  {
    id: "weekend_near_me",
    label: "Things to do this weekend near me",
    query: "Things to do this weekend near me",
    featured: true
  },
  {
    id: "concerts_near_me",
    label: "Find concerts near me",
    query: "Concerts near me this weekend",
    featured: true
  },
  {
    id: "phillies_tonight",
    label: "Watch the Phillies tonight",
    query: "Phillies game tonight",
    featured: true
  },
  {
    id: "dog_patio",
    label: "Dog-friendly patios nearby",
    query: "Dog-friendly patios near me"
  },
  {
    id: "cozy_dinner",
    label: "Cozy dinner spots",
    query: "Cozy dinner spots near me"
  },
  {
    id: "stream_movie",
    label: "Where can I stream this movie?",
    query: "Funny movies on Netflix tonight"
  },
  {
    id: "ev_chargers",
    label: "EV chargers near me",
    query: "EV chargers near me"
  }
];
