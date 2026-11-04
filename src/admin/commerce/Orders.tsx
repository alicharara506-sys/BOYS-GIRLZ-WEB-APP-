import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, Search, Truck } from "lucide-react";
import type { CommerceSnapshot } from "../../server/commerce/queries.server";
import {
  Badge,
  CommandForm,
  date,
  Download,
  Empty,
  Feedback,
  Field,
  Panel,
  PrintButton,
  Select,
  str,
  usd,
  useCommand,
} from "./ui";
type Props = { data: CommerceSnapshot };
export function Orders({ data }: Props) {
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("all");
  const orders = data.orders.filter(
    (o) =>
      (channel === "all" || o.channel === channel) &&
      (status === "all" || o.status === status) &&
      `${o.number} ${o.customerName} ${o.phone}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="co-page-head">
        <div>
          <p className="co-eyebrow">IN-STORE + ONLINE</p>
          <h1>
            Every little order<span>.</span>
          </h1>
          <p>One history for every way your customers shop.</p>
        </div>
        <div className="co-actions">
          <Download kind="orders" label="Export orders" />
          <Link className="co-button primary" to="/admin/pos?channel=online">
            Create online order <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
      <Panel>
        <div className="co-toolbar">
          <div className="co-search">
            <Search size={17} />
            <input
              aria-label="Search orders"
              placeholder="Order number, customer, phone…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            aria-label="Sales channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          >
            <option value="all">All channels</option>
            <option value="pos">In-store</option>
            <option value="online">Online</option>
          </select>
          <select
            aria-label="Order status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {[
              "all",
              "pending",
              "paid",
              "packed",
              "shipped",
              "delivered",
              "completed",
              "cancelled",
              "returned",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="co-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Paid / Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link className="co-strong" to={`/admin/orders/${o.id}`}>
                      BG-{String(o.number).padStart(6, "0")}
                    </Link>
                    {o.demo && <small>Sample / demo</small>}
                  </td>
                  <td>
                    {o.customerName}
                    <small>{o.phone}</small>
                  </td>
                  <td>{date(o.createdAt)}</td>
                  <td>
                    <Badge tone={o.channel === "pos" ? "blue" : "pink"}>
                      {o.channel === "pos" ? "In-store" : "Online"}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      tone={
                        ["paid", "completed", "delivered"].includes(o.status)
                          ? "green"
                          : "amber"
                      }
                    >
                      {o.status}
                    </Badge>
                  </td>
                  <td>
                    {usd(o.payments.reduce((s, p) => s + p.amount, 0))} /{" "}
                    <strong>{usd(o.total)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!orders.length && <Empty>No orders match these filters.</Empty>}
        </div>
      </Panel>
    </>
  );
}
export function OrderDetail({ data, id }: Props & { id: string }) {
  const order = data.orders.find((o) => o.id === id);
  const [packing, setPacking] = useState(false);
  if (!order) return <Empty>Order not found.</Empty>;
  const paid = order.payments.reduce((s, p) => s + p.amount, 0);
  return (
    <>
      <div className="co-page-head">
        <div>
          <p className="co-eyebrow">
            <Link to="/admin/orders">ORDERS</Link> / BG-
            {String(order.number).padStart(6, "0")}
          </p>
          <h1>
            A happy little delivery<span>.</span>
          </h1>
          <p>
            {date(order.createdAt)} ·{" "}
            {order.channel === "pos" ? "In-store sale" : "Online order"} ·{" "}
            <Badge>{order.status}</Badge>
          </p>
        </div>
        <div className="co-actions">
          <button className="co-button" onClick={() => setPacking(!packing)}>
            {packing ? "Show receipt" : "Packing slip"}
          </button>
          <PrintButton />
        </div>
      </div>
      <div className="co-detail-layout">
        <Panel className="co-receipt">
          <header>
            <span className="co-receipt-brand">
              Boys <i>&</i> Girlz
            </span>
            <p>{data.settings.shopAddress}</p>
            <p>{data.settings.shopPhone}</p>
            <Badge tone="amber">
              {packing ? "PACKING SLIP" : "RECEIPT"}
            </Badge>
            <h2>BG-{String(order.number).padStart(6, "0")}</h2>
            <p>{new Date(order.createdAt).toLocaleString()}</p>
          </header>
          <div className="co-receipt-customer">
            <strong>{order.customerName}</strong>
            <span>{order.phone}</span>
            <span>{order.address}</span>
          </div>
          <div className="co-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  {!packing && <th className="right">Amount</th>}
                </tr>
              </thead>
              <tbody>
                {order.items.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <strong>{l.name}</strong>
                      <small>
                        {l.size} · {l.color} · {l.sku}
                      </small>
                      {l.isQuickSale && (
                        <>
                          <Badge>Unlisted item</Badge>{" "}
                          <Link
                            className="co-text-link"
                            to={`/admin/products/new?name=${encodeURIComponent(l.name)}&price=${l.unitPrice}&category=${encodeURIComponent(l.category)}`}
                          >
                            Add to catalog
                          </Link>
                        </>
                      )}
                      {l.returned > 0 && <small>{l.returned} returned</small>}
                    </td>
                    <td>{l.quantity}</td>
                    {!packing && <td className="right">{usd(l.net)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!packing && (
            <dl className="co-totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{usd(order.subtotal)}</dd>
              </div>
              <div>
                <dt>Discounts / loyalty</dt>
                <dd>−{usd(order.discount)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>{usd(order.shipping)}</dd>
              </div>
              <div>
                <dt>Tax</dt>
                <dd>{usd(order.tax)}</dd>
              </div>
              <div className="total">
                <dt>Total</dt>
                <dd>{usd(order.total)}</dd>
              </div>
              {order.payments.map((p) => (
                <div key={p.id}>
                  <dt>{p.method} (recorded)</dt>
                  <dd>{usd(p.amount)}</dd>
                </div>
              ))}
              <div>
                <dt>Awaiting collection</dt>
                <dd>{usd(Math.max(0, order.total - paid))}</dd>
              </div>
              {order.returns.map((r) => (
                <div key={r.id}>
                  <dt>Returned · {r.method}</dt>
                  <dd>−{usd(r.amount)}</dd>
                </div>
              ))}
            </dl>
          )}
          <footer>
            {order.note && <p>{order.note}</p>}
            <p>{data.settings.receiptFooter}</p>
            <small>Boys & Girlz</small>
          </footer>
        </Panel>
        <aside>
          <Panel title="Customer & delivery">
            <p>
              <strong>{order.customerName}</strong>
            </p>
            <p>{order.phone}</p>
            <p>{order.address || "In-store pickup"}</p>
            {order.customerId && (
              <Link
                className="co-text-link"
                to={`/admin/customers/${order.customerId}`}
              >
                View customer history <ArrowUpRight size={15} />
              </Link>
            )}
            <p className="co-help">
              {order.pointsEarned} loyalty points earned · {order.pointsUsed}{" "}
              redeemed
            </p>
          </Panel>
          {order.channel === "online" && (
            <Panel
              title="Move it along"
              subtitle="COD can be packed before payment. Confirm collection when marking paid or delivered."
            >
              <CommandForm
                intent="order-status"
                build={(f) => ({
                  id: order.id,
                  status: str(f, "status"),
                  tracking: str(f, "tracking"),
                  carrier: str(f, "carrier"),
                  method: str(f, "method"),
                })}
              >
                <Select
                  name="status"
                  label="Order status"
                  value={order.status}
                  options={[
                    "pending",
                    "paid",
                    "packed",
                    "shipped",
                    "delivered",
                    "cancelled",
                  ]}
                />
                <Field
                  name="carrier"
                  label="Delivery provider"
                  value={order.carrier}
                />
                <Field
                  name="tracking"
                  label="Tracking number"
                  value={order.tracking}
                />
                <Select
                  name="method"
                  label="Payment collected through"
                  options={[
                    { value: "cash", label: "Cash on delivery" },
                    { value: "whish", label: "Whish — owner verified" },
                  ]}
                />
                <p className="co-help">
                  Cancellation restores stock and reverses the recorded payments
                  and books. Cash refunds require an open drawer.
                </p>
              </CommandForm>
            </Panel>
          )}
          {["completed", "delivered"].includes(order.status) && (
            <Panel title="Need a different size?">
              <p>Look up this receipt to return or exchange items.</p>
              <Link
                to={`/admin/returns?receipt=${order.number}`}
                className="co-button"
              >
                <Truck size={16} />
                Return / exchange
              </Link>
            </Panel>
          )}
        </aside>
      </div>
    </>
  );
}
export function Returns({ data }: Props) {
  const initial =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("receipt") || ""
      : "";
  const [query, setQuery] = useState(initial);
  const [orderId, setOrderId] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [restock, setRestock] = useState(true);
  const [method, setMethod] = useState("credit");
  const [reason, setReason] = useState("");
  const [replacement, setReplacement] = useState("");
  const [extraMethod, setExtraMethod] = useState("cash");
  const [tendered, setTendered] = useState(0);
  const cmd = useCommand();
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  useEffect(() => {
    if (cmd.data?.success) {
      setQuantities({});
      setRequestKey(crypto.randomUUID());
    }
  }, [cmd.data]);
  const order = data.orders.find((o) => o.id === orderId);
  const candidates = data.orders.filter(
    (o) =>
      ["completed", "delivered"].includes(o.status) &&
      `${o.number} ${o.customerName} ${o.phone}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const eligible = order?.items.filter((l) => l.returned < l.quantity) || [];
  const refund = eligible.reduce(
    (s, l) =>
      s +
      Math.floor(
        (l.net * (l.returned + (quantities[l.id] || 0))) / l.quantity,
      ) -
      Math.floor((l.net * l.returned) / l.quantity),
    0,
  );
  const variants = data.products
    .filter((p) => !p.archived)
    .flatMap((p) =>
      p.variants.filter((v) => v.stock > 0).map((v) => ({ ...v, product: p })),
    );
  const newVariant = variants.find((v) => v.id === replacement);
  const exchangeCost = newVariant?.product.price || 0;
  const availableCredit = refund + (order?.customer?.credit || 0);
  const useCredit = Math.min(exchangeCost, availableCredit);
  const difference = Math.max(0, exchangeCost - useCredit);
  const submit = () => {
    if (!order) return;
    cmd.run(replacement ? "exchange" : "return", {
      requestKey,
      orderId: order.id,
      items: eligible
        .filter((l) => (quantities[l.id] || 0) > 0)
        .map((l) => ({ lineId: l.id, quantity: quantities[l.id], restock })),
      method,
      reason,
      replacement: replacement
        ? {
            requestKey: crypto.randomUUID(),
            channel: "pos",
            customerId: order.customerId,
            items: [{ variantId: replacement, quantity: 1 }],
            payments: [
              { method: "credit", amount: useCredit },
              ...(difference
                ? [{ method: extraMethod, amount: difference }]
                : []),
            ],
            cashTendered: tendered,
          }
        : undefined,
    });
  };
  return (
    <>
      <div className="co-page-head">
        <div>
          <p className="co-eyebrow">A BETTER FIT</p>
          <h1>
            Returns & exchanges<span>.</span>
          </h1>
          <p>
            Demo return window: {data.settings.returnDays} days. Refunds exclude
            delivery and preserve item discounts.
          </p>
        </div>
      </div>
      <Panel title="Find the original receipt">
        <div className="co-search">
          <Search size={18} />
          <input
            placeholder="Receipt number, customer or phone…"
            aria-label="Receipt lookup"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <label className="co-field">
          <span>Completed / delivered sale</span>
          <select
            value={orderId}
            onChange={(e) => {
              setOrderId(e.target.value);
              setQuantities({});
              setReplacement("");
            }}
          >
            <option value="">Choose a receipt</option>
            {candidates.map((o) => (
              <option key={o.id} value={o.id}>
                BG-{o.number} · {o.customerName} · {usd(o.total)} ·{" "}
                {date(o.createdAt)}
              </option>
            ))}
          </select>
        </label>
      </Panel>
      <Feedback data={cmd.data} />
      {order && (
        <div className="co-detail-layout">
          <Panel title={`Return from BG-${order.number}`}>
            <div className="co-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Returnable</th>
                    <th>Return qty</th>
                  </tr>
                </thead>
                <tbody>
                  {eligible.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <strong>{l.name}</strong>
                        <small>
                          {l.size} · {l.color}
                        </small>
                      </td>
                      <td>{l.quantity - l.returned}</td>
                      <td>
                        <input
                          aria-label={`Return quantity ${l.name}`}
                          type="number"
                          min="0"
                          max={l.quantity - l.returned}
                          value={quantities[l.id] || 0}
                          onChange={(e) =>
                            setQuantities({
                              ...quantities,
                              [l.id]: Number(e.target.value),
                            })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <label className="co-check">
              <input
                type="checkbox"
                checked={restock}
                onChange={(e) => setRestock(e.target.checked)}
              />
              Return items to sellable stock
            </label>
            <label className="co-field">
              <span>Reason</span>
              <input
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <label className="co-field">
              <span>Refund method</span>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {["credit", "cash", "whish"].map((m) => (
                  <option key={m} value={m}>
                    {m === "credit" ? "Store credit" : m}
                  </option>
                ))}
              </select>
            </label>
            <div className="co-payment-total">
              {usd(refund)}
              <small>Refund / credit value</small>
            </div>
            <button
              className="co-button primary"
              disabled={
                !refund ||
                !reason ||
                cmd.busy ||
                (!!replacement && method !== "credit")
              }
              onClick={submit}
            >
              {replacement ? "Complete atomic exchange" : "Confirm return"}
            </button>
          </Panel>
          <Panel
            title="Make it an exchange"
            subtitle="A return and replacement sale save together. Choose store credit as the refund method."
          >
            {!order.customerId ? (
              <Empty>
                Exchanges using store credit require a named customer on the
                original sale.
              </Empty>
            ) : (
              <>
                <label className="co-field">
                  <span>Replacement item (one unit)</span>
                  <select
                    value={replacement}
                    onChange={(e) => {
                      setReplacement(e.target.value);
                      setMethod("credit");
                    }}
                  >
                    <option value="">No replacement — refund only</option>
                    {variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.product.name} · {v.size} · {v.color} ·{" "}
                        {usd(v.product.price)}
                      </option>
                    ))}
                  </select>
                </label>
                {replacement && (
                  <>
                    <p>
                      Replacement: <strong>{usd(exchangeCost)}</strong>
                    </p>
                    <p>
                      Store credit used: <strong>{usd(useCredit)}</strong>
                    </p>
                    <p>
                      Extra payment: <strong>{usd(difference)}</strong>
                    </p>
                    <label className="co-field">
                      <span>Extra payment method</span>
                      <select
                        value={extraMethod}
                        onChange={(e) => setExtraMethod(e.target.value)}
                      >
                        <option value="cash">Cash</option>
                        <option value="whish">Whish</option>
                      </select>
                    </label>
                    <label className="co-field">
                      <span>Cash received $ (if applicable)</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={tendered / 100}
                        onChange={(e) =>
                          setTendered(Math.round(Number(e.target.value) * 100))
                        }
                      />
                    </label>
                    <p className="co-help">
                      Any unused credit remains on the customer account.
                    </p>
                  </>
                )}
              </>
            )}
          </Panel>
        </div>
      )}
    </>
  );
}
