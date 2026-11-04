import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Barcode,
  Check,
  ChevronRight,
  Clock3,
  CreditCard,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import type { CommerceSnapshot } from "../../server/commerce/queries.server";
import { Badge, Empty, Feedback, Modal, usd, useCommand } from "./ui";
type CartLine = { variantId: string; quantity: number; discount: number };
type Product = CommerceSnapshot["products"][number];
type Pay = { method: string; amount: number; reference: string };
export default function POS({ data }: { data: CommerceSnapshot }) {
  const [params] = useSearchParams();
  const online = params.get("channel") === "online";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [customerId, setCustomer] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("fixed");
  const [points, setPoints] = useState(0);
  const [promo, setPromo] = useState("");
  const [checkout, setCheckout] = useState(false);
  const [parked, setParked] = useState(false);
  const [payments, setPayments] = useState<Pay[]>([]);
  const [cashTendered, setCash] = useState(0);
  const [note, setNote] = useState("");
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [lastSale, setLastSale] = useState<{
    id: string;
    number: number;
  } | null>(null);
  const cmd = useCommand();
  const park = useCommand();
  const resume = useCommand();
  const seen = useRef<unknown>(null);
  const parkedSeen = useRef<unknown>(null);
  const variants = data.products.flatMap((p) =>
    p.variants.map((v) => ({ ...v, product: p })),
  );
  const customer = data.customers.find((c) => c.id === customerId);
  const lines = cart
    .map((l) => ({
      ...l,
      variant: variants.find((v) => v.id === l.variantId)!,
    }))
    .filter((l) => l.variant);
  const subtotal = lines.reduce(
    (s, l) =>
      s +
      l.quantity *
        (online ? l.variant.product.onlinePrice : l.variant.product.price),
    0,
  );
  const lineDiscount = lines.reduce((s, l) => s + l.discount, 0);
  const afterLines = subtotal - lineDiscount;
  const promotion = data.promos.find(
    (p) => p.code === promo.toUpperCase() && p.active,
  );
  const promoValue = promotion
    ? promotion.kind === "percent"
      ? Math.round((afterLines * promotion.amount) / 100)
      : promotion.amount
    : 0;
  const totalDiscount =
    lineDiscount +
    (discountType === "percent"
      ? Math.round((afterLines * discount) / 100)
      : discount) +
    points * data.settings.pointValue +
    promoValue;
  const net = Math.max(0, subtotal - totalDiscount);
  const shipping =
    online && net < data.settings.freeShipping ? data.settings.shipping : 0;
  const total = net + shipping;
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const cashPayment = payments
    .filter((p) => p.method === "cash")
    .reduce((s, p) => s + p.amount, 0);
  const drawer = data.drawers.find((d) => !d.closedAt);
  useEffect(() => {
    if (cmd.data?.result?.number && cmd.data !== seen.current) {
      seen.current = cmd.data;
      setLastSale(cmd.data.result as { id: string; number: number });
      setCart([]);
      setCheckout(false);
      setDiscount(0);
      setPoints(0);
      setPromo("");
      setPayments([]);
      setCash(0);
      setKey(crypto.randomUUID());
    }
  }, [cmd.data]);
  useEffect(() => {
    if (park.data?.result?.id && park.data !== parkedSeen.current) {
      parkedSeen.current = park.data;
      setCart([]);
      setDiscount(0);
      setPoints(0);
      setPromo("");
      setKey(crypto.randomUUID());
    }
  }, [park.data]);
  const add = (variantId: string) => {
    const variant = variants.find((v) => v.id === variantId);
    if (!variant || variant.stock < 1) return;
    setCart((old) => {
      const exists = old.find((l) => l.variantId === variantId);
      return exists
        ? old.map((l) =>
            l.variantId === variantId
              ? { ...l, quantity: Math.min(l.quantity + 1, variant.stock) }
              : l,
          )
        : [...old, { variantId, quantity: 1, discount: 0 }];
    });
  };
  const visible = data.products.filter(
    (p) =>
      !p.archived &&
      (online ? p.published : !p.onlineOnly) &&
      (category === "All" || p.category === category) &&
      (!query ||
        `${p.name} ${p.brand} ${p.variants.map((v) => `${v.sku} ${v.barcode}`).join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase())),
  );
  const sale = () => ({
    requestKey: key,
    channel: online ? "online" : "pos",
    customerId: customerId || undefined,
    items: cart,
    discount,
    discountType,
    pointsUsed: points,
    promoCode: promo,
    payments: online && !checkout ? [] : payments,
    cashTendered,
    note: online ? `Demo ${note || "Cash on delivery"}` : note,
    address: customer?.address || "",
    phone: customer?.phone || "",
  });
  const begin = () => {
    setPayments([{ method: "cash", amount: total, reference: "" }]);
    setCash(total);
    setCheckout(true);
  };
  return (
    <>
      <div className="co-page-head">
        <div>
          <p className="co-eyebrow">
            {online ? "DEMO STOREFRONT" : "READY FOR LITTLE ADVENTURES"}
          </p>
          <h1>
            {online ? "Online order simulation" : "Let’s make a sale"}
            <span>.</span>
          </h1>
          <p>
            {online
              ? "Creates an unpaid demo online order using the same stock as the shop."
              : "Find a favorite, pick a size, and send them off smiling."}
          </p>
        </div>
        <div className="co-actions">
          <Link className="co-button" to="/admin/inventory">
            <Badge tone="amber">{data.lowStock.length}</Badge> Low stock
          </Link>
          <button className="co-button" onClick={() => setParked(true)}>
            <Clock3 size={17} />
            Parked ({data.parked.length})
          </button>
        </div>
      </div>
      {lastSale && (
        <div className="co-alert success">
          <Check size={18} />
          Saved BG-{String(lastSale.number).padStart(6, "0")}
          <Link to={`/admin/orders/${lastSale.id}`}>
            Open receipt <ChevronRight size={15} />
          </Link>
        </div>
      )}
      <div className="co-pos-layout">
        <section className="co-pos-catalog">
          <div className="co-search">
            <Search size={18} />
            <input
              aria-label="Search products or scan barcode"
              placeholder="Search a product or scan a barcode…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const variant = variants.find(
                    (v) => v.barcode === query.trim() || v.sku === query.trim(),
                  );
                  if (variant) {
                    add(variant.id);
                    setQuery("");
                  }
                }
              }}
            />
            <Barcode size={21} />
          </div>
          <div className="co-tabs">
            {["All", ...new Set(data.products.map((p) => p.category))].map(
              (c) => (
                <button
                  key={c}
                  className={category === c ? "active" : ""}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ),
            )}
          </div>
          <div className="co-pos-grid">
            {visible.map((p) => (
              <button
                className="co-pos-product"
                key={p.id}
                onClick={() => setSelected(p)}
              >
                <span className="co-pos-photo">
                  <img
                    src={
                      p.imageUrl ||
                      `/assets/catalog-previews/${p.imageIndex}.webp`
                    }
                    alt=""
                    loading="lazy"
                  />
                  {p.featured && <span>Favorite</span>}
                </span>
                <span className="co-pos-product-info">
                  <small>
                    {p.gender === "Girls" ? "Girlz" : p.gender} · {p.category}
                  </small>
                  <strong>{p.name}</strong>
                  <span>
                    <b>{usd(online ? p.onlinePrice : p.price)}</b>
                    <i>+ Add</i>
                  </span>
                </span>
              </button>
            ))}
          </div>
          {!visible.length && (
            <Empty>No matching products. Try another name or barcode.</Empty>
          )}
        </section>
        <aside className="co-pos-cart">
          <div className="co-panel-head">
            <h2>
              <ShoppingBag size={20} /> Current sale
            </h2>
            <span>{cart.reduce((s, l) => s + l.quantity, 0)} items</span>
          </div>
          <label className="co-field">
            <span>Customer</span>
            <select
              value={customerId}
              onChange={(e) => {
                setCustomer(e.target.value);
                setPoints(0);
              }}
            >
              <option value="">Walk-in customer</option>
              {data.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.points} pts · {usd(c.credit)} credit
                </option>
              ))}
            </select>
          </label>
          <div className="co-cart-lines">
            {lines.map((l) => (
              <div key={l.variantId} className="co-cart-line">
                <div>
                  <strong>{l.variant.product.name}</strong>
                  <small>
                    {l.variant.size} · {l.variant.color}
                  </small>
                  <label>
                    Line discount ${" "}
                    <input
                      aria-label={`Discount for ${l.variant.product.name}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.discount / 100}
                      onChange={(e) =>
                        setCart(
                          cart.map((item) =>
                            item.variantId === l.variantId
                              ? {
                                  ...item,
                                  discount: Math.round(
                                    Number(e.target.value) * 100,
                                  ),
                                }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
                </div>
                <strong>
                  {usd(
                    l.quantity *
                      (online
                        ? l.variant.product.onlinePrice
                        : l.variant.product.price) -
                      l.discount,
                  )}
                </strong>
                <div className="co-quantity">
                  <button
                    aria-label="Decrease quantity"
                    onClick={() =>
                      setCart(
                        cart.map((i) =>
                          i.variantId === l.variantId
                            ? { ...i, quantity: Math.max(1, i.quantity - 1) }
                            : i,
                        ),
                      )
                    }
                  >
                    <Minus size={14} />
                  </button>
                  <span>{l.quantity}</span>
                  <button
                    aria-label="Increase quantity"
                    disabled={l.quantity >= l.variant.stock}
                    onClick={() => add(l.variantId)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  className="co-icon"
                  aria-label={`Remove ${l.variant.product.name}`}
                  onClick={() =>
                    setCart(cart.filter((i) => i.variantId !== l.variantId))
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {!lines.length && (
              <Empty>
                <ShoppingBag size={31} />
                <strong>A little empty, for now.</strong>Tap a product to start
                your sale.
              </Empty>
            )}
          </div>
          <div className="co-cart-bottom">
            <div className="co-discount">
              <label>
                Sale discount
                <select
                  aria-label="Discount type"
                  value={discountType}
                  onChange={(e) => {
                    setDiscountType(e.target.value);
                    setDiscount(0);
                  }}
                >
                  <option value="fixed">$ Fixed</option>
                  <option value="percent">% Percent</option>
                </select>
              </label>
              <input
                aria-label="Sale discount"
                type="number"
                min="0"
                step={discountType === "percent" ? "1" : "0.01"}
                value={discountType === "percent" ? discount : discount / 100}
                onChange={(e) =>
                  setDiscount(
                    discountType === "percent"
                      ? Number(e.target.value)
                      : Math.round(Number(e.target.value) * 100),
                  )
                }
              />
            </div>
            <div className="co-two">
              <label className="co-field">
                <span>Promo code</span>
                <input
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  placeholder="Optional"
                />
              </label>
              <label className="co-field">
                <span>Redeem points</span>
                <input
                  type="number"
                  min="0"
                  max={Math.max(0, customer?.points || 0)}
                  disabled={!customer}
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                />
              </label>
            </div>
            <dl className="co-totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{usd(subtotal)}</dd>
              </div>
              <div>
                <dt>Discounts</dt>
                <dd>−{usd(totalDiscount)}</dd>
              </div>
              <div>
                <dt>Tax</dt>
                <dd>{usd(0)}</dd>
              </div>
              {online && (
                <div>
                  <dt>Delivery</dt>
                  <dd>{usd(shipping)}</dd>
                </div>
              )}
              <div className="total">
                <dt>Total</dt>
                <dd>{usd(total)}</dd>
              </div>
            </dl>
            <button
              className="co-button primary co-pay-button"
              disabled={!cart.length || cmd.busy}
              onClick={online ? () => cmd.run("sale", sale()) : begin}
            >
              {online ? "Create demo online order" : `Charge ${usd(total)}`}
              <ChevronRight size={18} />
            </button>
            {online && (
              <button
                className="co-button co-pay-button"
                disabled={!cart.length || cmd.busy}
                onClick={begin}
              >
                Record prepaid demo order / gift / credit
              </button>
            )}
            <Feedback data={cmd.data} />
            <div className="co-pos-secondary">
              <button
                disabled={!cart.length || park.busy}
                onClick={() => {
                  park.run("park", {
                    name:
                      customer?.name ||
                      `Sale ${new Date().toLocaleTimeString()}`,
                    payload: {
                      cart,
                      customerId,
                      discount,
                      discountType,
                      points,
                      promo,
                    },
                  });
                }}
              >
                Hold sale
              </button>
              <button
                onClick={() => {
                  setCart([]);
                  setKey(crypto.randomUUID());
                }}
              >
                Clear cart
              </button>
            </div>
            <Feedback data={park.data} />
            <Feedback data={resume.data} />
          </div>
        </aside>
      </div>
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <p>Choose an age size and color.</p>
          <div className="co-variant-options">
            {selected.variants.map((v) => (
              <button
                key={v.id}
                className="co-variant-option"
                disabled={v.stock === 0}
                onClick={() => {
                  add(v.id);
                  setSelected(null);
                }}
              >
                <strong>{v.size}</strong>
                <span>{v.color}</span>
                <small>{v.stock} in stock</small>
              </button>
            ))}
          </div>
        </Modal>
      )}
      {checkout && (
        <Modal
          title="Finish this little sale"
          onClose={() => setCheckout(false)}
        >
          <div className="co-payment-total">
            {usd(total)}
            <small>USD · no tax</small>
          </div>
          <Feedback data={cmd.data} />
          {!drawer && (
            <div className="co-alert">
              Cash requires an open drawer.{" "}
              <Link to="/admin/cash">Open cash drawer</Link>
            </div>
          )}
          {payments.map((p, i) => (
            <div className="co-payment-row" key={i}>
              <label className="co-field">
                <span>Method</span>
                <select
                  value={p.method}
                  onChange={(e) =>
                    setPayments(
                      payments.map((v, j) =>
                        j === i ? { ...v, method: e.target.value } : v,
                      ),
                    )
                  }
                >
                  {["cash", "card", "whish", "credit", "gift"].map((m) => (
                    <option key={m} value={m}>
                      {m === "whish"
                        ? "Whish (demo recorded)"
                        : m === "credit"
                          ? "Store credit"
                          : m === "gift"
                            ? "Gift card"
                            : m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="co-field">
                <span>Amount $</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={p.amount / 100}
                  onChange={(e) =>
                    setPayments(
                      payments.map((v, j) =>
                        j === i
                          ? {
                              ...v,
                              amount: Math.round(Number(e.target.value) * 100),
                            }
                          : v,
                      ),
                    )
                  }
                />
              </label>
              <button
                className="co-icon"
                aria-label="Remove payment"
                onClick={() => setPayments(payments.filter((_, j) => j !== i))}
              >
                <Trash2 size={17} />
              </button>
              {["gift", "whish", "card"].includes(p.method) && (
                <label className="co-field co-wide">
                  <span>
                    {p.method === "gift"
                      ? "Gift card code"
                      : "Payment reference (demo)"}
                  </span>
                  <input
                    value={p.reference}
                    onChange={(e) =>
                      setPayments(
                        payments.map((v, j) =>
                          j === i ? { ...v, reference: e.target.value } : v,
                        ),
                      )
                    }
                  />
                </label>
              )}
            </div>
          ))}
          <button
            className="co-button"
            onClick={() =>
              setPayments([
                ...payments,
                {
                  method: "card",
                  amount: Math.max(0, total - paid),
                  reference: "",
                },
              ])
            }
          >
            <Plus size={16} />
            Split payment
          </button>
          {cashPayment > 0 && (
            <label className="co-field">
              <span>Cash received $</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashTendered / 100}
                onChange={(e) =>
                  setCash(Math.round(Number(e.target.value) * 100))
                }
              />
            </label>
          )}
          <dl className="co-totals">
            <div>
              <dt>Remaining</dt>
              <dd>{usd(total - paid)}</dd>
            </div>
            <div>
              <dt>Change to give</dt>
              <dd>{usd(Math.max(0, cashTendered - cashPayment))}</dd>
            </div>
          </dl>
          <label className="co-field">
            <span>Receipt note</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <button
            className="co-button primary co-pay-button"
            disabled={
              cmd.busy ||
              paid !== total ||
              (cashPayment > 0 && (!drawer || cashTendered < cashPayment))
            }
            onClick={() => cmd.run("sale", sale())}
          >
            <CreditCard size={18} />
            {cmd.busy ? "Saving sale…" : "Complete demo sale"}
          </button>
        </Modal>
      )}
      {parked && (
        <Modal title="Parked sales" onClose={() => setParked(false)}>
          {data.parked.map((p) => (
            <div className="co-parked-row" key={p.id}>
              <strong>{p.name}</strong>
              <button
                className="co-button"
                onClick={() => {
                  const s = p.payload as {
                    cart: CartLine[];
                    customerId: string;
                    discount: number;
                    discountType: string;
                    points: number;
                    promo: string;
                  };
                  setCart(s.cart);
                  setCustomer(s.customerId);
                  setDiscount(s.discount);
                  setDiscountType(s.discountType);
                  setPoints(s.points);
                  setPromo(s.promo);
                  setKey(crypto.randomUUID());
                  resume.run("remove-parked", { id: p.id });
                  setParked(false);
                }}
              >
                Resume
              </button>
              <button
                className="co-icon"
                aria-label="Delete parked sale"
                onClick={() => resume.run("remove-parked", { id: p.id })}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {!data.parked.length && <Empty>No parked sales.</Empty>}
        </Modal>
      )}
    </>
  );
}
