import { useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, Baby, Plus, Search, Trash2 } from "lucide-react";
import type { CommerceSnapshot } from "../../server/commerce/queries.server";
import {
  Badge,
  CommandForm,
  date,
  Download,
  Empty,
  Field,
  Panel,
  Select,
  str,
  usd,
} from "./ui";
type Props = { data: CommerceSnapshot };
export function Customers({ data }: Props) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("all");
  const tags = [...new Set(data.customers.flatMap((c) => c.tags))];
  const customers = data.customers.filter(
    (c) =>
      (tag === "all" || c.tags.includes(tag)) &&
      `${c.name} ${c.phone} ${c.email} ${c.children.map((k) => k.name).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="co-page-head">
        <div>
          <p className="co-eyebrow">PEOPLE BEHIND THE LITTLE PURCHASES</p>
          <h1>
            Your growing community<span>.</span>
          </h1>
          <p>Families, favorites, and a shared history across both channels.</p>
        </div>
        <div className="co-actions">
          <Download kind="customers" label="Export CSV" />
          <Link className="co-button primary" to="/admin/customers/new">
            <Plus size={17} />
            Add customer
          </Link>
        </div>
      </div>
      <Panel>
        <div className="co-toolbar">
          <div className="co-search">
            <Search size={17} />
            <input
              aria-label="Search customers"
              placeholder="Name, phone, email or child…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            aria-label="Customer segment"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          >
            <option value="all">All segments</option>
            {tags.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="co-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Little ones</th>
                <th>Segments</th>
                <th>Lifetime spend</th>
                <th>Loyalty / Credit</th>
                <th>Last visit</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link className="co-strong" to={`/admin/customers/${c.id}`}>
                      {c.name}
                    </Link>
                    <small>
                      {c.phone} · {c.demo ? "Sample customer" : c.email}
                    </small>
                  </td>
                  <td>
                    {c.children.map((k) => (
                      <small key={k.id}>
                        <Baby size={12} /> {k.name} · {k.size}
                      </small>
                    ))}
                  </td>
                  <td>
                    {c.tags.map((t) => (
                      <Badge key={t} tone="pink">
                        {t}
                      </Badge>
                    ))}
                  </td>
                  <td>
                    <strong>{usd(c.lifetimeValue)}</strong>
                    <small>{c.visits} orders</small>
                  </td>
                  <td>
                    {c.points} pts<small>{usd(c.credit)} store credit</small>
                  </td>
                  <td>{c.lastVisit ? date(c.lastVisit) : "Not yet"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!customers.length && <Empty>No customers match this view.</Empty>}
        </div>
      </Panel>
    </>
  );
}
type ChildInput = {
  name: string;
  birthdate: string;
  gender: string;
  size: string;
};
export function CustomerDetail({ data, id }: Props & { id: string }) {
  const customer = data.customers.find((c) => c.id === id);
  const [children, setChildren] = useState<ChildInput[]>(
    customer?.children.map((c) => ({
      ...c,
      birthdate: c.birthdate.slice(0, 10),
    })) || [],
  );
  const history = data.orders.filter((o) => o.customerId === id);
  if (id !== "new" && !customer) return <Empty>Customer not found.</Empty>;
  return (
    <>
      <div className="co-page-head">
        <div>
          <p className="co-eyebrow">
            <Link to="/admin/customers">COMMUNITY</Link> / CUSTOMER DETAILS
          </p>
          <h1>
            {customer?.name || "A new hello"}
            <span>.</span>
          </h1>
          <p>
            {customer
              ? `${usd(customer.lifetimeValue)} lifetime spend · ${customer.points} points · ${usd(customer.credit)} store credit`
              : "A family profile for every stage of growing up."}
          </p>
        </div>
        <Link className="co-button" to="/admin/customers">
          All customers
        </Link>
      </div>
      <CommandForm
        intent="customer"
        build={(f) => ({
          id: customer?.id,
          name: str(f, "name"),
          phone: str(f, "phone"),
          email: str(f, "email"),
          address: str(f, "address"),
          tags: str(f, "tags")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          children,
        })}
      >
        <Panel title="Family details">
          <div className="co-two">
            <Field
              name="name"
              label="Full name"
              value={customer?.name}
              required
            />
            <Field
              name="phone"
              label="Phone"
              value={customer?.phone}
              required
              type="tel"
            />
            <Field
              name="email"
              label="Email"
              type="email"
              value={customer?.email}
            />
            <Field name="address" label="Address" value={customer?.address} />
            <Field
              name="tags"
              label="Segments / tags (comma separated)"
              value={customer?.tags.join(", ")}
              placeholder="VIP, Newborn parents"
            />
          </div>
        </Panel>
        <Panel
          title="Little ones"
          subtitle="Birthdays and current sizes help you plan thoughtful reminders."
          action={
            <button
              className="co-button"
              type="button"
              onClick={() =>
                setChildren([
                  ...children,
                  {
                    name: "",
                    birthdate: "",
                    gender: "Unisex",
                    size: "0–3 Months",
                  },
                ])
              }
            >
              <Plus size={16} />
              Add child
            </button>
          }
        >
          {children.map((child, i) => (
            <div className="co-child-row" key={i}>
              <label className="co-field">
                <span>Child’s name</span>
                <input
                  required
                  value={child.name}
                  onChange={(e) =>
                    setChildren(
                      children.map((c, j) =>
                        j === i ? { ...c, name: e.target.value } : c,
                      ),
                    )
                  }
                />
              </label>
              <label className="co-field">
                <span>Birthdate</span>
                <input
                  type="date"
                  required
                  max={new Date().toISOString().slice(0, 10)}
                  value={child.birthdate}
                  onChange={(e) =>
                    setChildren(
                      children.map((c, j) =>
                        j === i ? { ...c, birthdate: e.target.value } : c,
                      ),
                    )
                  }
                />
              </label>
              <label className="co-field">
                <span>Gender category</span>
                <select
                  value={child.gender}
                  onChange={(e) =>
                    setChildren(
                      children.map((c, j) =>
                        j === i ? { ...c, gender: e.target.value } : c,
                      ),
                    )
                  }
                >
                  {["Boys", "Girls", "Unisex"].map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </label>
              <label className="co-field">
                <span>Current size</span>
                <input
                  value={child.size}
                  required
                  onChange={(e) =>
                    setChildren(
                      children.map((c, j) =>
                        j === i ? { ...c, size: e.target.value } : c,
                      ),
                    )
                  }
                />
              </label>
              <button
                className="co-icon"
                type="button"
                aria-label="Remove child profile"
                onClick={() => setChildren(children.filter((_, j) => i !== j))}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          {!children.length && (
            <Empty>
              Add a child profile when the parent chooses to share it.
            </Empty>
          )}
        </Panel>
      </CommandForm>
      {customer && (
        <>
          <Panel
            title="Purchase history"
            subtitle="In-store and online, together"
          >
            <div className="co-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Date</th>
                    <th>Channel</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link
                          className="co-text-link"
                          to={`/admin/orders/${o.id}`}
                        >
                          BG-{o.number} <ArrowUpRight size={13} />
                        </Link>
                      </td>
                      <td>{date(o.createdAt)}</td>
                      <td>{o.channel}</td>
                      <td>{o.status}</td>
                      <td>
                        {usd(
                          o.total - o.returns.reduce((s, r) => s + r.amount, 0),
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel title="Points & credit activity">
            <div className="co-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Reason</th>
                    <th>Points</th>
                    <th>Store credit</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.loyalty.map((l) => (
                    <tr key={l.id}>
                      <td>{date(l.createdAt)}</td>
                      <td>{l.reason}</td>
                      <td>
                        {l.points > 0 ? "+" : ""}
                        {l.points}
                      </td>
                      <td>{usd(l.credit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
export function Marketing({ data }: Props) {
  const [audience, setAudience] = useState("birthdays");
  const options = [
    { value: "all", label: "All customers" },
    { value: "birthdays", label: "Children’s birthdays this month" },
    { value: "size-up", label: "Size-up reminder (90+ days since visit)" },
    { value: "back-to-school", label: "Back to school (ages 4–14)" },
    ...[...new Set(data.customers.flatMap((c) => c.tags))].map((t) => ({
      value: t,
      label: t,
    })),
  ];
  const now = new Date();
  const customers = data.customers.filter(
    (c) =>
      audience === "all" ||
      (audience === "birthdays" &&
        c.children.some(
          (k) => new Date(k.birthdate).getUTCMonth() === now.getUTCMonth(),
        )) ||
      (audience === "size-up" &&
        c.children.length > 0 &&
        (!c.lastVisit || +now - +new Date(c.lastVisit) > 90 * 86400000)) ||
      (audience === "back-to-school" &&
        c.children.some(
          (k) =>
            (+now - +new Date(k.birthdate)) / 31557600000 >= 4 &&
            (+now - +new Date(k.birthdate)) / 31557600000 <= 14,
        )) ||
      c.tags.includes(audience),
  );
  return (
    <>
      <div className="co-page-head">
        <div>
          <p className="co-eyebrow">THOUGHTFUL LITTLE REMINDERS</p>
          <h1>
            Keep in touch<span>.</span>
          </h1>
          <p>
            Build targeted lists. Sending is simulated; no SMS or email leaves
            this app.
          </p>
        </div>
      </div>
      <div className="co-detail-layout">
        <Panel title="Create a campaign">
          <CommandForm
            intent="campaign"
            label="Simulate campaign"
            build={(f) => ({
              name: str(f, "name"),
              audience,
              channel: str(f, "channel"),
              message: str(f, "message"),
            })}
          >
            <Field
              label="Campaign name"
              name="name"
              required
              placeholder="A birthday treat"
            />
            <label className="co-field">
              <span>Audience</span>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              >
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <Select
              name="channel"
              label="Channel (mock integration)"
              options={["sms", "email"]}
            />
            <label className="co-field">
              <span>Message</span>
              <textarea
                name="message"
                required
                rows={5}
                maxLength={500}
                placeholder="A little hello from Boys & Girlz…"
              />
            </label>
            <Badge tone="blue">
              {customers.length} families in this audience
            </Badge>
          </CommandForm>
        </Panel>
        <Panel
          title="Audience preview"
          action={
            <Download
              kind="campaign"
              label="Export list CSV"
              segment={audience}
            />
          }
        >
          <p className="co-help">
            Review contacts and consent before using a real marketing service.
          </p>
          {customers.map((c) => (
            <div className="co-stock-row" key={c.id}>
              <span className="co-owner-avatar">{c.name[0]}</span>
              <div>
                <strong>{c.name}</strong>
                <small>
                  {c.phone} · {c.email}
                </small>
              </div>
            </div>
          ))}
          {!customers.length && (
            <Empty>No families match this segment yet.</Empty>
          )}
        </Panel>
      </div>
      <Panel title="Campaign history">
        <div className="co-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Audience</th>
                <th>Channel</th>
                <th>Recipients</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.campaigns.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.audience}</td>
                  <td>{c.channel}</td>
                  <td>{c.count}</td>
                  <td>
                    <Badge tone="blue">{c.status}</Badge>
                  </td>
                  <td>{date(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.campaigns.length && (
            <Empty>Your simulated campaigns will appear here.</Empty>
          )}
        </div>
      </Panel>
    </>
  );
}
