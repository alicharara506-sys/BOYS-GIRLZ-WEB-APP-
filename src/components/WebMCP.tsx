import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { products, productById } from "../data/products";
import { useStore } from "../state/Store";

type ModelTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute: (input: Record<string, unknown>) => unknown;
};

declare global {
  interface Document {
    modelContext?: {
      registerTool: (
        tool: ModelTool,
        options?: { signal?: AbortSignal },
      ) => void | Promise<void>;
    };
  }
}

export default function WebMCP() {
  const { add, toggleWish } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: ModelTool) => {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => undefined);
      } catch {
        // Browsers may expose an experimental API with a different revision.
      }
    };

    register({
      name: "search_products",
      title: "Search products",
      description:
        "Find products by name or category and return matching catalog items.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input) {
        if (typeof input.query !== "string")
          throw new Error("query must be a string");
        const query = input.query.trim().toLowerCase();
        return products
          .filter((product) =>
            `${product.name} ${product.category}`.toLowerCase().includes(query),
          )
          .slice(0, 12)
          .map(({ id, name, category, price, sizes, colors }) => ({
            id,
            name,
            category,
            price,
            sizes,
            colors,
          }));
      },
    });

    register({
      name: "add_product_to_cart",
      title: "Add product to cart",
      description: "Add a catalog product variant to the visible shopping bag.",
      inputSchema: {
        type: "object",
        properties: {
          productId: { type: "string" },
          size: { type: "string" },
          color: { type: "string" },
          quantity: { type: "integer", minimum: 1, maximum: 10 },
        },
        required: ["productId"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const product = productById(String(input.productId));
        if (!product) throw new Error("Unknown productId");
        const size =
          input.size === undefined ? product.sizes[0] : String(input.size);
        const color =
          input.color === undefined ? product.colors[0] : String(input.color);
        const quantity =
          input.quantity === undefined ? 1 : Number(input.quantity);
        if (!product.sizes.includes(size))
          throw new Error("Size is unavailable");
        if (!product.colors.includes(color))
          throw new Error("Color is unavailable");
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10)
          throw new Error("Quantity must be an integer from 1 to 10");
        add(product, size, color, quantity);
        return { added: true, productId: product.id, size, color, quantity };
      },
    });

    register({
      name: "save_product_to_wishlist",
      title: "Save product to wishlist",
      description: "Toggle a product in the visible wishlist.",
      inputSchema: {
        type: "object",
        properties: { productId: { type: "string" } },
        required: ["productId"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const product = productById(String(input.productId));
        if (!product) throw new Error("Unknown productId");
        toggleWish(product.id);
        return { toggled: true, productId: product.id };
      },
    });

    register({
      name: "open_product",
      title: "Open product",
      description: "Navigate the storefront to a product detail page.",
      inputSchema: {
        type: "object",
        properties: { productId: { type: "string" } },
        required: ["productId"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input) {
        const product = productById(String(input.productId));
        if (!product) throw new Error("Unknown productId");
        navigate(`/product/${product.id}`);
        return { opened: true, productId: product.id };
      },
    });

    return () => lifecycle.abort();
  }, [add, navigate, toggleWish]);

  return null;
}
