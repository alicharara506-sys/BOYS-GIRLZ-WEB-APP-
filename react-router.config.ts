import type { Config } from "@react-router/dev/config";
import { categories, products } from "./src/data/products";

export default {
  appDirectory: "src",
  ssr: true,
  prerender: [
    "/",
    "/shop",
    "/about",
    "/contact",
    "/faq",
    "/help/shipping",
    "/help/returns",
    "/help/sizing",
    ...categories.map((category) => `/category/${category.toLowerCase()}`),
    ...products.map((product) => `/product/${product.id}`),
  ],
} satisfies Config;
