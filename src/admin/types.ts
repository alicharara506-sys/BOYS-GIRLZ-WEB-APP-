import type { Product } from "../data/products";

export type AdminVariant = {
  id: string;
  productId: string;
  sku: string;
  size: string | null;
  color: string | null;
  stock: number;
  published: boolean;
};

export type AdminProduct = Product & {
  published: boolean;
  archived: boolean;
  stock: number;
  variants: AdminVariant[];
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminProductInput = Omit<Product, "id"> & {
  id?: string;
  slug?: string;
  published?: boolean;
  imageUrl?: string | null;
};

export type AdminCustomer = {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  governorate: string;
  cityArea: string;
  streetBuilding: string;
  orderCount: number;
  totalSpentCents: number;
  createdAt: string;
};

export type AdminOrderStatus = "pending" | "confirmed" | "packed" | "delivered" | "cancelled";
export type AdminOrderItem = {
  variantId: string;
  productId: string;
  productName: string;
  sku: string;
  size: string | null;
  color: string | null;
  unitPriceCents: number;
  quantity: number;
};
export type AdminOrder = {
  id: string;
  orderNumber: string;
  status: AdminOrderStatus;
  customer: AdminCustomer;
  items: AdminOrderItem[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  paymentMethod: "cash_on_delivery";
  promoCode: string | null;
  landmark?: string;
  deliveryNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminPromo = {
  code: string;
  discountType: "percent" | "fixed";
  amount: number;
  minSubtotalCents: number;
  usageLimit: number | null;
  uses: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
};

export type AdminOverview = {
  productCount: number;
  publishedCount: number;
  draftCount: number;
  stockUnits: number;
  lowStockCount: number;
  orderCount: number;
  pendingOrderCount: number;
  customerCount: number;
  revenueCents: number;
  recentOrders: AdminOrder[];
  lowStockProducts: AdminProduct[];
};
