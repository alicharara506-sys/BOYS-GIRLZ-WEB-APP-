import { useState } from "react";
import { Form } from "react-router";
import { Plus } from "lucide-react";
import type { CommerceSnapshot } from "../../server/commerce/queries.server";
import { SalesChart } from "./Overview";
import {
  amount,
  Badge,
  Check,
  CommandForm,
  date,
  Download,
  Empty,
  Feedback,
  Field,
  flag,
  num,
  Panel,
  PrintButton,
  Select,
  str,
  usd,
  useCommand,
} from "./ui";
type Props = { data: CommerceSnapshot };
const paymentOptions = [
  { value: "cash", label: "Cash" },
  { value: "whish", label: "Whish" },
];
export function Suppliers({ data }: Props) {
  const [editing, setEditing] = useState("");
  const supplier = data.suppliers.find((s) => s.id === editing);
  return (
    <>
      <div className="co-page-head">
        <div>
          <p className="co-eyebrow">GOOD THINGS START WITH GOOD PARTNERS</p>
          <h1>
            Suppliers<span>.</span>
          </h1>
          <p>Contacts, orders, and balances in one place.</p>
        </div>
      </div>
      <div className="co-detail-layout">
        <Panel title="Your partners">
          <div className="co-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Contact</th>
                  <th>Outstanding</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.suppliers.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.name}</strong>
                      <small>{s.address}</small>
                    </td>
                    <td>
                      {s.phone}
                      <small>{s.email}</small>
                    </td>
                    <td>
                      {usd(
                        data.purchases
                          .filter(
                            (p) =>
                              p.supplierId === s.id && p.status === "received",
                          )
                          .reduce((sum, p) => sum + p.total - p.paid, 0),
                      )}
                    </td>
                    <td>
                      <button
                        className="co-text-link"
                        onClick={() => setEditing(s.id)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title={supplier ? "Edit supplier" : "Add a supplier"}>
          <CommandForm
            key={editing}
            intent="supplier"
            build={(f) => ({
              id: supplier?.id,
              name: str(f, "name"),
              phone: str(f, "phone"),
              email: str(f, "email"),
              address: str(f, "address"),
            })}
          >
            <Field
              name="name"
              label="Supplier name"
              value={supplier?.name}
              required
            />
            <Field name="phone" label="Phone" value={supplier?.phone} />
            <Field
              name="email"
              label="Email"
              type="email"
              value={supplier?.email}
            />
            <Field name="address" label="Address" value={supplier?.address} />
          </CommandForm>
          {supplier && (
            <button className="co-text-link" onClick={() => setEditing("")}>
              Add a different supplier
            </button>
          )}
        </Panel>
      </div>
    </>
  );
}
export function Purchases({ data }: Props) {
  const [adding, setAdding] = useState(false);
  const [lines, setLines] = useState([{ variantId: "", quantity: 1, cost: 0 }]);
  const cmd = useCommand();
  const variants = data.products
    .filter((p) => !p.archived)
    .flatMap((p) => p.variants.map((v) => ({ ...v, product: p })));
  return (
    <>
      <div className="co-page-head">
        <div>
          <p className="co-eyebrow">KEEP THE FAVORITES COMING</p>
          <h1>
            Purchases & invoices<span>.</span>
          </h1>
          <p>
            Receive stock once, then settle the supplier balance in full or in
            parts.
          </p>
        </div>
        <button
          className="co-button primary"
          onClick={() => setAdding(!adding)}
        >
          <Plus size={17} />
          {adding ? "Hide form" : "New purchase order"}
        </button>
      </div>
      <Feedback data={cmd.data} />
      {adding && (
        <Panel title="New purchase order">
          <CommandForm
            intent="purchase"
            build={(f) => ({
              supplierId: str(f, "supplierId"),
              invoiceNumber: str(f, "invoiceNumber"),
              dueDate: str(f, "dueDate"),
              items: lines,
            })}
          >
            <div className="co-three">
              <Select
                label="Supplier"
                name="supplierId"
                options={data.suppliers.map((s) => ({
                  value: s.id,
                  label: s.name,
                }))}
              />
              <Field
                label="Supplier invoice / reference"
                name="invoiceNumber"
                required
              />
              <Field
                label="Due date"
                name="dueDate"
                type="date"
                required
                value={new Date().toISOString().slice(0, 10)}
              />
            </div>
            {lines.map((line, i) => (
              <div className="co-purchase-line" key={i}>
                <label className="co-field">
                  <span>Variant</span>
                  <select
                    required
                    value={line.variantId}
                    onChange={(e) => {
                      const v = variants.find((v) => v.id === e.target.value);
                      setLines(
                        lines.map((l, j) =>
                          i === j
                            ? {
                                ...l,
                                variantId: e.target.value,
                                cost: v?.product.cost || 0,
                              }
                            : l,
                        ),
                      );
                    }}
                  >
                    <option value="">Choose a product / size / color</option>
                    {variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.product.name} · {v.size} · {v.color}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="co-field">
                  <span>Qty</span>
                  <input
                    required
                    min="1"
                    type="number"
                    value={line.quantity}
                    onChange={(e) =>
                      setLines(
                        lines.map((l, j) =>
                          i === j
                            ? { ...l, quantity: Number(e.target.value) }
                            : l,
                        ),
                      )
                    }
                  />
                </label>
                <label className="co-field">
                  <span>Unit cost $</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.cost / 100}
                    onChange={(e) =>
                      setLines(
                        lines.map((l, j) =>
                          i === j
                            ? {
                                ...l,
                                cost: Math.round(Number(e.target.value) * 100),
                              }
                            : l,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  className="co-text-link"
                  onClick={() => setLines(lines.filter((_, j) => i !== j))}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              className="co-button"
              type="button"
              onClick={() =>
                setLines([...lines, { variantId: "", quantity: 1, cost: 0 }])
              }
            >
              Add line
            </button>
            <strong>
              Total {usd(lines.reduce((s, l) => s + l.cost * l.quantity, 0))}
            </strong>
          </CommandForm>
        </Panel>
      )}
      {data.purchases.map((p) => (
        <Panel
          key={p.id}
          title={`PO-${p.number} · ${p.supplier.name}`}
          subtitle={`Invoice ${p.invoiceNumber} · Due ${p.dueDate ? date(p.dueDate) : "—"}`}
          action={
            <Badge tone={p.status === "received" ? "green" : "blue"}>
              {p.status}
            </Badge>
          }
        >
          <div className="co-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit cost</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {p.items.map((l) => (
                  <tr key={l.id}>
                    <td>
                      {l.variant.product.name}
                      <small>
                        {l.variant.size} · {l.variant.color}
                      </small>
                    </td>
                    <td>{l.quantity}</td>
                    <td>{usd(l.cost)}</td>
                    <td>{usd(l.cost * l.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="co-invoice-bottom">
            <p>
              Total <strong>{usd(p.total)}</strong> · Paid {usd(p.paid)} ·
              Balance <strong>{usd(p.total - p.paid)}</strong>
            </p>
            {p.status === "ordered" ? (
              <button
                className="co-button primary"
                disabled={cmd.busy}
                onClick={() => cmd.run("receive-purchase", { id: p.id })}
              >
                Receive stock & book invoice
              </button>
            ) : p.paid < p.total ? (
              <CommandForm
                className="co-inline"
                intent="pay-supplier"
                label="Record payment"
                build={(f) => ({
                  id: p.id,
                  amount: amount(f.get("amount")),
                  method: str(f, "method"),
                  reference: str(f, "reference"),
                })}
              >
                <Field
                  name="amount"
                  label="Pay $"
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={(p.total - p.paid) / 100}
                  required
                />
                <Select label="Method" name="method" options={paymentOptions} />
                <Field label="Reference" name="reference" />
              </CommandForm>
            ) : (
              <Badge tone="green">Paid in full</Badge>
            )}
          </div>
          {p.payments.map((payment) => (
            <p className="co-help" key={payment.id}>
              {date(payment.createdAt)} · {payment.method} ·{" "}
              {usd(payment.amount)} · {payment.reference}
            </p>
          ))}
        </Panel>
      ))}
      {!data.purchases.length && (
        <Panel>
          <Empty>
            No purchase orders yet. Create one to restock your collection.
          </Empty>
        </Panel>
      )}
    </>
  );
}
export function CashDrawer({ data }: Props) {
  const active = data.drawers.find((d) => !d.closedAt);
  const expected = active
    ? active.opening +
      active.payments.reduce((s, p) => s + p.amount, 0) +
      active.cashEvents.reduce((s, p) => s + p.amount, 0)
    : 0;
  return (
    <>
      <div className="co-page-head">
        <div>
          <p className="co-eyebrow">EVERY DOLLAR ACCOUNTED FOR</p>
          <h1>
            The cash drawer<span>.</span>
          </h1>
          <p>
            Opening float allocates existing cash. Close once per shift to save
            a Z-report.
          </p>
        </div>
        <PrintButton label="Print Z-report / PDF" />
      </div>
      <div className="co-detail-layout">
        <Panel title={active ? "Current cash session" : "Start a new session"}>
          {active ? (
            <>
              <div className="co-payment-total">
                {usd(expected)}
                <small>Expected in the drawer</small>
              </div>
              <dl className="co-totals">
                <div>
                  <dt>Opening float</dt>
                  <dd>{usd(active.opening)}</dd>
                </div>
                <div>
                  <dt>Cash receipts</dt>
                  <dd>
                    {usd(active.payments.reduce((s, p) => s + p.amount, 0))}
                  </dd>
                </div>
                <div>
                  <dt>Refunds, expenses & other movements</dt>
                  <dd>
                    {usd(active.cashEvents.reduce((s, p) => s + p.amount, 0))}
                  </dd>
                </div>
              </dl>
              <CommandForm
                intent="close-drawer"
                label="Close session & save Z-report"
                build={(f) => ({
                  id: active.id,
                  counted: amount(f.get("counted")),
                  note: str(f, "note"),
                })}
              >
                <Field
                  name="counted"
                  label="Counted cash $"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                />
                <Field name="note" label="Reconciliation note" />
              </CommandForm>
            </>
          ) : (
            <CommandForm
              intent="open-drawer"
              label="Open cash drawer"
              build={(f) => ({ opening: amount(f.get("opening")) })}
            >
              <Field
                name="opening"
                label="Opening float $"
                type="number"
                min={0}
                step="0.01"
                required
                value={100}
              />
              <p className="co-help">
                Cash sales, refunds, gift cards, expenses, and supplier payments
                update this session.
              </p>
            </CommandForm>
          )}
        </Panel>
        <Panel title="Session activity">
          {active ? (
            <div className="co-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Movement</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {active.payments.map((p) => (
                    <tr key={p.id}>
                      <td>
                        Sale collection
                        <small>
                          {new Date(p.createdAt).toLocaleTimeString()}
                        </small>
                      </td>
                      <td>{usd(p.amount)}</td>
                    </tr>
                  ))}
                  {active.cashEvents.map((e) => (
                    <tr key={e.id}>
                      <td>{e.reason}</td>
                      <td>{usd(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>Open a session to start taking cash payments.</Empty>
          )}
        </Panel>
      </div>
      <Panel title="Saved Z-reports">
        <div className="co-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Session closed</th>
                <th>Opening</th>
                <th>Expected</th>
                <th>Counted</th>
                <th>Variance</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {data.drawers
                .filter((d) => d.closedAt)
                .map((d) => (
                  <tr key={d.id}>
                    <td>{new Date(d.closedAt!).toLocaleString()}</td>
                    <td>{usd(d.opening)}</td>
                    <td>{usd(d.expected || 0)}</td>
                    <td>{usd(d.counted || 0)}</td>
                    <td>
                      <Badge tone={d.variance ? "amber" : "green"}>
                        {usd(d.variance || 0)}
                      </Badge>
                    </td>
                    <td>{d.note}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
export function Accounting({ data }: Props) {
  return (
    <>
      <div className="co-page-head">
        <div>
          <p className="co-eyebrow">THE BOOKS, WITHOUT THE FUSS</p>
          <h1>
            Accounting<span>.</span>
          </h1>
          <p>
            Balanced journals link every sale, return, stock change, and
            supplier invoice.
          </p>
        </div>
        <Download
          kind="journal"
          label="Export journals"
          from={data.report.from}
          to={data.report.to}
        />
      </div>
      <div className="co-detail-layout">
        <Panel title="Record an expense">
          <CommandForm
            intent="expense"
            label="Save expense & journal"
            build={(f) => ({
              category: str(f, "category"),
              amount: amount(f.get("amount")),
              method: str(f, "method"),
              note: str(f, "note"),
              date: str(f, "date"),
            })}
          >
            <div className="co-two">
              <Select
                name="category"
                label="Category"
                options={[
                  "Rent",
                  "Salaries",
                  "Utilities",
                  "Marketing",
                  "Supplies",
                  "Other",
                ]}
              />
              <Field
                name="amount"
                label="Amount $"
                type="number"
                min={0.01}
                step="0.01"
                required
              />
              <Select
                name="method"
                label="Paid through"
                options={paymentOptions}
              />
              <Field
                name="date"
                label="Expense date"
                type="date"
                required
                value={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <Field name="note" label="Description / reference" required />
          </CommandForm>
        </Panel>
        <Panel title="Recent expenses">
          <div className="co-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date / Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.expenses.slice(0, 8).map((e) => (
                  <tr key={e.id}>
                    <td>
                      {date(e.date)}
                      <small>{e.note}</small>
                    </td>
                    <td>{e.category}</td>
                    <td>{usd(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.expenses.length && <Empty>No expenses recorded yet.</Empty>}
          </div>
        </Panel>
      </div>
      <Panel
        title="Chart of accounts"
        subtitle="Balance is lifetime debit less credit; the report period is shown on the Reports page."
      >
        <div className="co-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Account</th>
                <th>Type</th>
                <th className="right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.accounts.map((a) => (
                <tr key={a.code}>
                  <td>{a.code}</td>
                  <td>{a.name}</td>
                  <td>{a.type}</td>
                  <td className="right">{usd(a.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel
        title="Journal entries"
        subtitle={`${data.report.from} — ${data.report.to}`}
      >
        <div className="co-journals">
          {data.journals.slice(0, 40).map((j) => (
            <details key={j.id}>
              <summary>
                <strong>{j.memo}</strong>
                <span>{date(j.date)}</span>
                <Badge tone="green">Balanced</Badge>
              </summary>
              <table>
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Debit</th>
                    <th>Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {j.lines.map((l) => (
                    <tr key={l.id}>
                      <td>
                        {l.accountId} · {l.account.name}
                      </td>
                      <td>{usd(l.debit)}</td>
                      <td>{usd(l.credit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <small className="co-reference">{j.reference}</small>
            </details>
          ))}
        </div>
      </Panel>
    </>
  );
}
export function Reports({ data }: Props) {
  const [unlisted, setUnlisted] = useState(false);
  const quick = data.orders
    .filter(
      (o) =>
        o.createdAt.slice(0, 10) >= data.report.from &&
        o.createdAt.slice(0, 10) <= data.report.to,
    )
    .flatMap((o) =>
      o.items
        .filter((l) => l.isQuickSale)
        .map((l) => ({ ...l, number: o.number })),
    );
  const report = data.report;
  const monthly = new Map<
    string,
    { month: string; pos: number; online: number }
  >();
  for (const day of report.series) {
    const month = day.date.slice(0, 7);
    const row = monthly.get(month) || { month, pos: 0, online: 0 };
    row.pos += day.pos;
    row.online += day.online;
    monthly.set(month, row);
  }
  return (
    <>
      <div className="co-page-head">
        <div>
          <p className="co-eyebrow">SEE THE BIGGER PICTURE</p>
          <h1>
            Reports & insights<span>.</span>
          </h1>
          <p>
            USD · no VAT or sales tax · accrual bookkeeping with weighted
            average inventory cost.
          </p>
        </div>
        <div className="co-actions">
          <Download
            kind="reports"
            label="Export CSV"
            from={report.from}
            to={report.to}
          />
          <PrintButton />
        </div>
      </div>
      <Form method="get" className="co-report-filter">
        <Field name="from" label="From (UTC)" type="date" value={report.from} />
        <Field name="to" label="Through (UTC)" type="date" value={report.to} />
        <button className="co-button primary">Apply dates</button>
      </Form>
      <div className="co-kpis">
        {[
          ["Net income", report.income],
          ["Cost of goods", report.cogs],
          ["Operating expenses", report.expense],
          ["Net profit / loss", report.profit],
        ].map(([label, value]) => (
          <article className="co-kpi" key={label}>
            <span>{label}</span>
            <strong>{usd(Number(value))}</strong>
          </article>
        ))}
      </div>
      <div className="co-detail-layout">
        <Panel title="Profit & Loss">
          <dl className="co-totals">
            <div>
              <dt>Sales and delivery income, less returns</dt>
              <dd>{usd(report.income)}</dd>
            </div>
            <div>
              <dt>Cost of goods sold</dt>
              <dd>−{usd(report.cogs)}</dd>
            </div>
            <div>
              <dt>Gross profit</dt>
              <dd>{usd(report.income - report.cogs)}</dd>
            </div>
            <div>
              <dt>Operating expenses / adjustments</dt>
              <dd>−{usd(report.expense)}</dd>
            </div>
            <div className="total">
              <dt>Net profit / loss</dt>
              <dd>{usd(report.profit)}</dd>
            </div>
          </dl>
          <p className="co-help">
            Accepted COD orders post to receivables; cash arrives when
            collection is confirmed. Cancellation reverses the sale.
          </p>
        </Panel>
        <Panel title="Sales by channel">
          <dl className="co-totals">
            <div>
              <dt>In-store</dt>
              <dd>{usd(report.pos)}</dd>
            </div>
            <div>
              <dt>Online</dt>
              <dd>{usd(report.online)}</dd>
            </div>
            <div>
              <dt>Orders</dt>
              <dd>{report.count}</dd>
            </div>
            <div>
              <dt>Tax collected</dt>
              <dd>{usd(report.tax)}</dd>
            </div>
            <div>
              <dt>Cash / Whish net movement</dt>
              <dd>{usd(report.cashFlow)}</dd>
            </div>
          </dl>
          <p className="co-help">
            Sales breakdowns follow order dates and net item returns. P&L
            follows journal dates, including returns in the selected period.
          </p>
        </Panel>
      </div>
      <Panel title="Unlisted items sold">
        <label className="co-check">
          <input
            type="checkbox"
            checked={unlisted}
            onChange={(e) => setUnlisted(e.target.checked)}
          />
          Show quick-sale lines in this period
        </label>
        {unlisted && (
          <div className="co-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Sales</th>
                  <th>Known cost</th>
                </tr>
              </thead>
              <tbody>
                {quick.map((l) => (
                  <tr key={l.id}>
                    <td>BG-{l.number}</td>
                    <td>{l.name}</td>
                    <td>{l.quantity}</td>
                    <td>{usd(l.net)}</td>
                    <td>
                      {l.unitCost === null
                        ? "Not provided"
                        : usd(l.unitCost * l.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <Panel title="Daily sales summary">
        <SalesChart data={data} />
        <div className="co-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>In-store</th>
                <th>Online</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {report.series.map((r) => (
                <tr key={r.date}>
                  <td>{r.date}</td>
                  <td>{usd(r.pos)}</td>
                  <td>{usd(r.online)}</td>
                  <td>{usd(r.pos + r.online)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Monthly sales summary">
        <div className="co-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>In-store</th>
                <th>Online</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {[...monthly.values()].map((row) => (
                <tr key={row.month}>
                  <td>{row.month}</td>
                  <td>{usd(row.pos)}</td>
                  <td>{usd(row.online)}</td>
                  <td>{usd(row.pos + row.online)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="co-detail-layout">
        <Panel title="Sales by product">
          <div className="co-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Net units</th>
                  <th>Net item sales</th>
                </tr>
              </thead>
              <tbody>
                {report.topProducts.map((p) => (
                  <tr key={p.name}>
                    <td>{p.name}</td>
                    <td>{p.quantity}</td>
                    <td>{usd(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Sales by category">
          <div className="co-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Net item sales</th>
                </tr>
              </thead>
              <tbody>
                {report.categories.map((c) => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td>{usd(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
      <Panel
        title="Current inventory valuation"
        subtitle="Live on-hand stock, independent of the sales date filter"
        action={<Download kind="inventory" label="Export valuation CSV" />}
      >
        <p className="co-payment-total">
          {usd(report.inventoryValue)}
          <small>
            {data.kpis.units} available units · weighted average unit cost
            (rounded cents)
          </small>
        </p>
        <p className="co-help">
          Supplier purchases update the weighted average cost. Per-unit cent
          rounding can create a small difference from the inventory ledger.
        </p>
      </Panel>
    </>
  );
}
export function Rewards({ data }: Props) {
  return (
    <>
      <div className="co-page-head">
        <div>
          <p className="co-eyebrow">A LITTLE EXTRA LOVE</p>
          <h1>
            Loyalty & gift cards<span>.</span>
          </h1>
          <p>
            Default: {data.settings.pointsPerDollar} point per $1; each point is
            worth {usd(data.settings.pointValue)}. Change this in Settings.
          </p>
        </div>
      </div>
      <div className="co-three-panels">
        <Panel title="Issue a gift card">
          <CommandForm
            intent="gift"
            label="Record payment & issue card"
            build={(f) => ({
              amount: amount(f.get("amount")),
              method: str(f, "method"),
            })}
          >
            <Field
              name="amount"
              label="Gift card value $"
              type="number"
              min={0.01}
              step="0.01"
              required
            />
            <Select
              name="method"
              label="Paid through"
              options={paymentOptions}
            />
          </CommandForm>
        </Panel>
        <Panel title="Grant store credit">
          <CommandForm
            intent="credit"
            label="Grant credit"
            build={(f) => ({
              customerId: str(f, "customerId"),
              amount: amount(f.get("amount")),
              reason: str(f, "reason"),
            })}
          >
            <Select
              label="Customer"
              name="customerId"
              options={data.customers.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
            />
            <Field
              name="amount"
              label="Credit value $"
              type="number"
              min={0.01}
              step="0.01"
              required
            />
            <Field
              name="reason"
              label="Reason (booked as marketing expense)"
              required
            />
          </CommandForm>
        </Panel>
        <Panel title="Promotion code">
          <CommandForm
            intent="promo"
            label="Save promotion"
            build={(f) => ({
              code: str(f, "code"),
              kind: str(f, "kind"),
              amount:
                str(f, "kind") === "fixed"
                  ? amount(f.get("amount"))
                  : num(f, "amount"),
              minimum: amount(f.get("minimum")),
              active: flag(f, "active"),
              expiresAt: str(f, "expiresAt"),
              limit: num(f, "limit"),
            })}
          >
            <Field name="code" label="Code" required />
            <Select
              label="Discount type"
              name="kind"
              options={[
                { value: "percent", label: "Percentage" },
                { value: "fixed", label: "Fixed USD" },
              ]}
            />
            <Field
              name="amount"
              label="Amount (% or $)"
              type="number"
              min={0}
              step="0.01"
              required
            />
            <Field
              name="minimum"
              label="Minimum spend $"
              type="number"
              min={0}
              step="0.01"
              value={0}
            />
            <Field
              name="limit"
              label="Usage limit (0 = unlimited)"
              type="number"
              min={0}
              value={0}
            />
            <Field name="expiresAt" label="Expires" type="date" />
            <label className="co-check">
              <input name="active" type="checkbox" defaultChecked />
              Active
            </label>
          </CommandForm>
        </Panel>
      </div>
      <div className="co-detail-layout">
        <Panel title="Gift cards">
          <div className="co-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Issued</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.gifts.map((g) => (
                  <tr key={g.id}>
                    <td className="co-strong">{g.code}</td>
                    <td>{usd(g.issued)}</td>
                    <td>{usd(g.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Promotion codes">
          <div className="co-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Used</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.promos.map((p) => (
                  <tr key={p.code}>
                    <td>{p.code}</td>
                    <td>
                      {p.kind === "percent" ? `${p.amount}%` : usd(p.amount)}
                    </td>
                    <td>
                      {p.used}
                      {p.limit ? ` / ${p.limit}` : ""}
                    </td>
                    <td>
                      <Badge tone={p.active ? "green" : ""}>
                        {p.active ? "Active" : "Paused"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
export function ShopSettings({ data }: Props) {
  const s = data.settings;
  return (
    <>
      <div className="co-page-head">
        <div>
          <p className="co-eyebrow">MAKE IT YOUR OWN</p>
          <h1>
            The little details<span>.</span>
          </h1>
          <p>
            One owner · one shop · USD · no tax. No roles or user management.
          </p>
        </div>
      </div>
      <CommandForm
        intent="settings"
        build={(f) => ({
          shopName: str(f, "shopName"),
          shopPhone: str(f, "shopPhone"),
          shopAddress: str(f, "shopAddress"),
          receiptFooter: str(f, "receiptFooter"),
          shipping: amount(f.get("shipping")),
          freeShipping: amount(f.get("freeShipping")),
          pointsPerDollar: num(f, "pointsPerDollar"),
          pointValue: num(f, "pointValue"),
          returnDays: num(f, "returnDays"),
          demo: flag(f, "demo"),
        })}
      >
        <div className="co-detail-layout">
          <Panel title="Shop & receipt">
            <div className="co-form">
              <Field
                name="shopName"
                label="Shop name"
                value={s.shopName}
                required
              />
              <Field
                name="shopPhone"
                label="Public phone"
                value={s.shopPhone}
              />
              <Field
                name="shopAddress"
                label="Shop address"
                value={s.shopAddress}
                placeholder="Add your confirmed address"
              />
              <Field
                name="receiptFooter"
                label="Receipt footer"
                value={s.receiptFooter}
              />
              <Check
                name="demo"
                label="Testing workspace — mark new sales as sample data"
                value={s.demo}
              />
            </div>
          </Panel>
          <Panel title="Delivery & rewards">
            <div className="co-form co-two">
              <Field
                name="shipping"
                label="Delivery fee $"
                type="number"
                min={0}
                step="0.01"
                value={s.shipping / 100}
              />
              <Field
                name="freeShipping"
                label="Free delivery from $"
                type="number"
                min={0}
                step="0.01"
                value={s.freeShipping / 100}
              />
              <Field
                name="pointsPerDollar"
                label="Points earned per $1"
                type="number"
                min={0}
                step="1"
                value={s.pointsPerDollar}
              />
              <Field
                name="pointValue"
                label="Redemption value per point (cents)"
                type="number"
                min={0}
                step="1"
                value={s.pointValue}
              />
              <Field
                name="returnDays"
                label="Return window in days"
                type="number"
                min={0}
                step="1"
                value={s.returnDays}
              />
            </div>
          </Panel>
        </div>
      </CommandForm>
      <Panel title="Connections">
        <div className="co-integration-grid">
          {[
            ["Storefront", "Connected to this website", "green"],
            ["Database", "Supabase · shared stock", "green"],
            ["Whish", "Owner-confirmed payment recording", "amber"],
          ].map(([name, description, tone]) => (
            <div key={name}>
              <strong>{name}</strong>
              <Badge tone={tone}>{description}</Badge>
            </div>
          ))}
        </div>
        <p className="co-help">
          The owner account, shared database, image storage, and campaign
          history use the same Supabase project.
        </p>
      </Panel>
    </>
  );
}
