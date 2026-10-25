export type Category =
  | "Boys"
  | "Girls"
  | "Unisex"
  | "Accessories"
  | "Maternity"
  | "Toys"
  | "Outlet"
  | "Sale";
export type ModelKind =
  "romper" | "cardigan" | "set" | "boots" | "bunny" | "dress" | "duck";
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: Category;
  gender: "Boys" | "Girls" | "Unisex" | null;
  condition: "new" | "like-new";
  productType: string;
  image: number;
  sizes: string[];
  colors: string[];
  model: ModelKind;
  isNew: boolean;
  description: string;
  // The product's brand, from the approved list in brands.ts; not yet assigned for any product.
  brand?: string;
}
export const categories: Category[] = [
  "Boys",
  "Girls",
  "Unisex",
  "Accessories",
  "Maternity",
  "Toys",
  "Outlet",
  "Sale",
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
// Approximate child height for each size, in cm (standard height-based sizing; brands vary a little).
export const sizeHeights: Record<string, string> = {
  "New Born": "up to 56", "0–3 Months": "56–62", "3–6 Months": "62–68", "6–9 Months": "68–74",
  "9–12 Months": "74–80", "12–18 Months": "80–86", "18–24 Months": "86–92", "2–3 Years": "92–98",
  "3–4 Years": "98–104", "4–5 Years": "104–110", "5–6 Years": "110–116",
};
const baby = [...sizeOptions];
const maternitySizes = ["S", "M", "L", "XL", "XXL"];
const rows: [string, number, Category, number, ModelKind, string[], number?][] =
  [
    ["Everyday Overshirt", 28, "Boys", 8, "set", ["Blue", "Sage", "Cream"]],
    ["Gingham Day Dress", 32, "Girls", 9, "dress", ["Pink", "Cream"]],
    ["Happy Days Tee", 18, "Unisex", 10, "set", ["Cream", "Blue", "Sage"]],
    ["Adventure Overalls", 36, "Unisex", 11, "romper", ["Blue", "Pink"]],
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
  gender: r[2] === "Boys" || r[2] === "Girls" || r[2] === "Unisex"
    ? r[2]
    : r[2] === "Outlet"
      ? i === 32 ? "Boys" : i === 33 ? "Girls" : "Unisex"
      : null,
  condition: r[2] === "Outlet" ? "like-new" : "new",
  productType: r[2] === "Maternity" ? "maternity" : r[2] === "Toys" ? "toys" : r[4] === "boots" ? "shoes" : r[4],
  image: r[3],
  model: r[4],
  colors: r[5],
  originalPrice: r[6],
  sizes: r[2] === "Maternity" ? maternitySizes : r[2] === "Toys" || r[4] === "boots" ? [] : baby,
  isNew: i === 0 || i === 2 || (i >= 4 && i < 8),
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
export const matchesCategory = (product: Product, category: Category) =>
  category === "Sale" ? product.condition === "new" && Boolean(product.originalPrice)
    : category === "Outlet" ? product.condition === "like-new"
      : category === "Boys" || category === "Girls" || category === "Unisex"
        ? product.gender === category
        : product.category === category;
