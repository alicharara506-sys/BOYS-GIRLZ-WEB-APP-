export type Category =
  | "Boys"
  | "Girls"
  | "Unisex"
  | "Accessories"
  | "Maternity"
  | "Toys"
  | "Outlet";
export type ModelKind =
  "romper" | "cardigan" | "set" | "boots" | "bunny" | "dress" | "duck";
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: Category;
  image: number;
  sizes: string[];
  colors: string[];
  model: ModelKind;
  isNew: boolean;
  rating: number;
  reviews: number;
  description: string;
}
export const categories: Category[] = [
  "Boys",
  "Girls",
  "Unisex",
  "Accessories",
  "Maternity",
  "Toys",
  "Outlet",
];
export const colorHex: Record<string, string> = {
  Blue: "#9bbbd7",
  Pink: "#e6afb3",
  Cream: "#e9decc",
  Sage: "#b6c8b4",
  Gold: "#e7c777",
};
export const sizeOptions = [
  "New Born",
  "0–3 Months",
  "3–6 Months",
  "6–9 Months",
  "9–12 Months",
  "12–18 Months",
  "18–24 Months",
  "2–3 Years",
  "3–4 Years",
  "4–5 Years",
  "5–6 Years",
] as const;
const baby = [...sizeOptions];
const maternitySizes = ["S", "M", "L", "XL", "XXL"];
const rows: [string, number, Category, number, ModelKind, string[], number?][] =
  [
    ["Fleece Bear Overall", 34.9, "Boys", 0, "romper", ["Blue", "Cream"]],
    ["Little Safari Romper", 29.9, "Unisex", 1, "romper", ["Cream", "Blue"]],
    ["Knit Hooded Cardigan", 39.9, "Girls", 2, "cardigan", ["Pink", "Cream"]],
    ["Teddy Bear Sweater Set", 32.9, "Unisex", 3, "set", ["Cream", "Sage"]],
    [
      "Cloud Puffer Overall",
      49.9,
      "Boys",
      4,
      "romper",
      ["Blue", "Cream"],
      64.9,
    ],
    [
      "Little Cloud Booties",
      18.9,
      "Accessories",
      5,
      "boots",
      ["Cream", "Pink"],
    ],
    ["Bunny’s First Cuddles", 24.9, "Toys", 6, "bunny", ["Cream"]],
    [
      "The Sunday Maternity Dress",
      59.9,
      "Maternity",
      7,
      "dress",
      ["Pink", "Sage"],
    ],
    ["Blueberry Snuggle Suit", 36.9, "Boys", 0, "romper", ["Blue"]],
    ["Little Explorer Playsuit", 27.9, "Boys", 1, "romper", ["Cream", "Blue"]],
    ["Rosebud Knit Cardigan", 37.9, "Girls", 2, "cardigan", ["Pink"]],
    ["Sweet Dreams Romper", 28.9, "Girls", 1, "romper", ["Cream", "Pink"]],
    [
      "Blush Teddy Cardigan",
      42.9,
      "Girls",
      2,
      "cardigan",
      ["Pink", "Cream"],
      52.9,
    ],
    ["Little Cub Lounge Set", 35.9, "Unisex", 3, "set", ["Cream", "Sage"]],
    ["Everyday Safari Sleepsuit", 26.9, "Unisex", 1, "romper", ["Cream"]],
    [
      "First Steps Knit Booties",
      19.9,
      "Accessories",
      5,
      "boots",
      ["Cream", "Blue"],
    ],
    [
      "Cozy Toes Gift Set",
      22.9,
      "Accessories",
      5,
      "boots",
      ["Cream", "Pink"],
      28.9,
    ],
    ["Tiny Treasures Booties", 16.9, "Accessories", 5, "boots", ["Cream"]],
    ["Bedtime Bunny", 28.9, "Toys", 6, "bunny", ["Cream"]],
    ["Little Friend Plush Bunny", 21.9, "Toys", 6, "bunny", ["Cream"]],
    ["Golden Bath Duck", 12.9, "Toys", 6, "duck", ["Gold"]],
    [
      "Soft Embrace Nursing Dress",
      54.9,
      "Maternity",
      7,
      "dress",
      ["Pink", "Cream"],
    ],
    [
      "Bloom Maternity Wrap",
      64.9,
      "Maternity",
      7,
      "dress",
      ["Pink", "Sage"],
      79.9,
    ],
    ["Easy Days Maternity Dress", 49.9, "Maternity", 7, "dress", ["Pink"]],
    ["Winter Bear Snowsuit", 54.9, "Boys", 4, "romper", ["Blue"]],
    ["Peach Blossom Cardigan", 34.9, "Girls", 2, "cardigan", ["Pink", "Cream"]],
    ["Oatmeal Teddy Set", 31.9, "Unisex", 3, "set", ["Cream"]],
    ["Hug Me Bunny Gift", 32.9, "Toys", 6, "bunny", ["Cream"], 39.9],
    ["Like New Bear Playsuit", 18.9, "Outlet", 0, "romper", ["Blue"]],
    ["Like New Blush Cardigan", 21.9, "Outlet", 2, "cardigan", ["Pink"]],
    ["Like New Cozy Gift Set", 16.9, "Outlet", 3, "set", ["Cream"]],
  ];
export const products: Product[] = rows.map((r, i) => ({
  id: r[0]
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replaceAll(" ", "-"),
  name: r[0],
  price: r[1],
  category: r[2],
  image: r[3],
  model: r[4],
  colors: r[5],
  originalPrice: r[6],
  sizes: r[2] === "Maternity" ? maternitySizes : baby,
  isNew: i < 8,
  rating: 4.8 + (i % 3) / 10,
  reviews: 12 + i * 3,
  description:
    r[2] === "Toys"
      ? "A little companion for big imaginations. Thoughtfully chosen for playtime, quiet moments, and the sweetest gifting."
      : r[2] === "Maternity"
        ? "A little room to grow, a lot of room to feel good. A relaxed silhouette with easy, everyday comfort through every chapter."
        : "Made for sleepy cuddles and everyday adventures. Soft to the touch, easy to wear, and full of the little details you’ll love.",
}));
export const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );
export const productById = (id: string) => products.find((p) => p.id === id);
