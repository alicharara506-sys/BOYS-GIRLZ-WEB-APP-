import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("shop", "routes/shop.tsx"),
  route("category/:category", "routes/category.tsx"),
  route("product/:id", "routes/product.tsx"),
  route("cart", "routes/cart.tsx"),
  route("checkout", "routes/checkout.tsx"),
  route("wishlist", "routes/wishlist.tsx"),
  route("about", "routes/about.tsx"),
  route("contact", "routes/contact.tsx"),
  route("faq", "routes/faq.tsx"),
  route("help/:topic", "routes/help.tsx"),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
