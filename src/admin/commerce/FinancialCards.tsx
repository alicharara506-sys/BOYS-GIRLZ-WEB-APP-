import { useState } from "react";
import type { CommerceSnapshot } from "../../server/commerce/queries.server";
import { financials } from "../../domain/financials";
import { usd } from "./ui";
function Metric({
  name,
  data,
}: {
  name: keyof ReturnType<typeof financials>;
  data: CommerceSnapshot;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [period, setPeriod] = useState("month");
  const [from, setFrom] = useState(today.slice(0, 7) + "-01");
  const [to, setTo] = useState(today);
  const start =
    period === "today"
      ? today
      : period === "week"
        ? new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)
        : period === "month"
          ? today.slice(0, 7) + "-01"
          : from;
  const value = financials(
    data.orders,
    data.expenses,
    data.liabilities,
    start,
    period === "custom" ? to : today,
  )[name];
  return (
    <article className="co-kpi">
      <div>
        <span>{name}</span>
        <select
          aria-label={`${name} period`}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          {["today", "week", "month", "custom"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>
      <strong>{usd(value)}</strong>
      {period === "custom" && (
        <div className="co-two">
          <input
            aria-label={`${name} from`}
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            aria-label={`${name} through`}
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      )}
      <small>
        {name === "Liabilities"
          ? "Currently outstanding"
          : `${start} — ${period === "custom" ? to : today}`}
      </small>
    </article>
  );
}
export default function FinancialCards({ data }: { data: CommerceSnapshot }) {
  return (
    <div className="co-kpis co-financial-six">
      {(
        [
          "Sales",
          "Expenses",
          "Liabilities",
          "COGS",
          "Gross Profit",
          "Net Profit",
        ] as const
      ).map((name) => (
        <Metric name={name} data={data} key={name} />
      ))}
    </div>
  );
}
