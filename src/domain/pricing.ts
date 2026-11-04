export type PriceDiscount = {
  discountType?: string | null;
  discountValue?: number;
};
// All calculations use USD cents on the server and in the POS/storefront.
export function finalPrice(price: number, product: PriceDiscount) {
  const value = product.discountValue || 0;
  const discount =
    product.discountType === "percentage"
      ? Math.round((price * value) / 100)
      : product.discountType === "amount"
        ? value
        : 0;
  return Math.max(0, price - discount);
}
