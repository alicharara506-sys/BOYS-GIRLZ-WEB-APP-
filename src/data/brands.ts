// Brand names confirmed by the shop owner. Product-to-brand assignments remain unverified.
export const approvedBrands = [
  "Carter's", "Old Navy", "Gap", "Little& loved", "Little beginners",
  "Koala baby", "Nicole Miller", "Disney", "Gerber", "Little Me",
  "Nike", "Garanimals", "Cloud Island", "Cat & jack", "Hudson Baby",
  "First Impression", "Baby Essentials", "Baby View", "Kyle & Deena",
  "Sweet & Soft", "Rabbit+Bear", "Eddie Bauer", "Wonder Nation",
  "Tahari", "Chickpea", "Burt's Bees", "DuckDuckGoose", "Calvin Klein",
] as const;

export const brandSlug = (brand: string) => brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
