import FinancialCards from "./FinancialCards";
import { Link } from "react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Package,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CommerceSnapshot } from "../../server/commerce/queries.server";
import { Badge, Empty, Panel, usd } from "./ui";
export function SalesChart({ data }: { data: CommerceSnapshot }) {
  return (
    <div className="co-chart">
      <ResponsiveContainer width="100%" height={245}>
        <AreaChart data={data.report.series}>
          <defs>
            <linearGradient id="salesBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--bng-tone-357)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--bng-tone-357)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="salesPink" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--bng-tone-358)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--bng-tone-358)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 4"
            vertical={false}
            stroke="var(--bng-tone-359)"
          />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => String(v).slice(5)}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            minTickGap={25}
          />
          <YAxis
            tickFormatter={(v) => `$${v / 100}`}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={45}
          />
          <Tooltip formatter={(v) => usd(Number(v))} />
          <Area
            name="In-store"
            isAnimationActive={false}
            type="monotone"
            dataKey="pos"
            stroke="var(--bng-tone-360)"
            strokeWidth={2.5}
            fill="url(#salesBlue)"
          />
          <Area
            name="Online"
            isAnimationActive={false}
            type="monotone"
            dataKey="online"
            stroke="var(--bng-tone-361)"
            strokeWidth={2.5}
            fill="url(#salesPink)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export default function Overview({ data }: { data: CommerceSnapshot }) {
  const { kpis } = data;

  return (
    <>
      <div className="co-page-head">
        <div>
          <p className="co-eyebrow">YOUR SHOP, AT A GLANCE</p>
          <h1>
            A little overview<span>.</span>
          </h1>
          <p>Good things are growing. Here’s how your shop is doing.</p>
        </div>
        <Link className="co-button primary" to="/admin/pos">
          <ShoppingBag size={17} />
          New sale <ArrowUpRight size={16} />
        </Link>
      </div>
      <FinancialCards data={data} />
      <div className="co-dashboard-middle">
        <Panel
          title="Little sales, big picture"
          subtitle={`${data.report.from} — ${data.report.to}`}
          action={
            <Link to="/admin/reports" className="co-text-link">
              View report <ArrowUpRight size={15} />
            </Link>
          }
        >
          <div className="co-chart-legend">
            <span className="blue" />
            In-store <span className="pink" />
            Online
          </div>
          <SalesChart data={data} />
        </Panel>
        <Panel
          className="co-channel-panel"
          title="Where they shop"
          subtitle="Sales across both channels"
        >
          <div className="co-channel-total">
            {usd(data.report.sales)}
            <small>Total sales this period</small>
          </div>
          {[
            ["In-store", data.report.pos, "blue"],
            ["Online", data.report.online, "pink"],
          ].map(([label, value, tone]) => (
            <div className="co-channel" key={String(label)}>
              <div>
                <span>{label}</span>
                <strong>{usd(Number(value))}</strong>
              </div>
              <div className="co-progress">
                <i
                  className={String(tone)}
                  style={{
                    width: `${data.report.sales ? (Number(value) / data.report.sales) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
          <div className="co-tiny-summary">
            <span>
              Cash on hand<strong>{usd(kpis.cash)}</strong>
            </span>
            <span>
              Supplier balance<strong>{usd(kpis.payable)}</strong>
            </span>
          </div>
        </Panel>
      </div>
      <div className="co-dashboard-bottom">
        <Panel
          title="Recent little orders"
          subtitle="The latest from your shop and storefront"
          action={
            <Link to="/admin/orders" className="co-text-link">
              All orders <ArrowRight size={15} />
            </Link>
          }
        >
          <div className="co-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th className="right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.slice(0, 6).map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="co-strong"
                      >
                        BG-{String(order.number).padStart(6, "0")}
                      </Link>
                    </td>
                    <td>{order.customerName}</td>
                    <td>
                      <Badge tone={order.channel === "pos" ? "blue" : "pink"}>
                        {order.channel === "pos" ? "In-store" : "Online"}
                      </Badge>
                    </td>
                    <td>
                      <Badge
                        tone={
                          ["completed", "delivered", "paid"].includes(
                            order.status,
                          )
                            ? "green"
                            : "amber"
                        }
                      >
                        {order.status}
                      </Badge>
                    </td>
                    <td className="right co-strong">{usd(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.orders.length && (
              <Empty>Your first sale will appear here.</Empty>
            )}
          </div>
        </Panel>
        <Panel
          title="A little stock check"
          subtitle="Top up these favorites soon"
          action={
            <span className="co-alert-count">{data.lowStock.length}</span>
          }
        >
          {data.lowStock.slice(0, 4).map((v) => (
            <div className="co-stock-row" key={v.id}>
              <span className="co-stock-avatar">
                <Package size={18} />
              </span>
              <div>
                <strong>{v.productName}</strong>
                <small>
                  {v.size} · {v.color}
                </small>
              </div>
              <Badge tone="amber">{v.stock} left</Badge>
            </div>
          ))}
          {!data.lowStock.length && (
            <Empty>All sizes are comfortably stocked.</Empty>
          )}
          <Link className="co-stock-link" to="/admin/inventory">
            Manage inventory <ArrowRight size={16} />
          </Link>
        </Panel>
      </div>
      <div className="co-gentle-note">
        <Sparkles size={21} />
        <div>
          <strong>One happy, connected shop.</strong>
          <span>
            POS and online orders share the same inventory, customers, and
            books.
          </span>
        </div>
        <Link to="/admin/settings">
          Shop settings <ArrowUpRight size={15} />
        </Link>
      </div>
    </>
  );
}
