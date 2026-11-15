import { useState } from "react";
import { Form, Link, NavLink, useLocation } from "react-router";
import {
  ArrowUpRight,
  Boxes,
  ChartNoAxesCombined,
  CircleDollarSign,
  Gift,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  Settings,
  ShoppingBag,
  Store,
  Truck,
  X,
  ListTree,
} from "lucide-react";
import type { CommerceSnapshot } from "../../server/commerce/queries.server";
import { TokenContext } from "./ui";
import Overview from "./Overview";
import MenuCategories from "./MenuCategories";
import POS from "./POS";
import { Inventory, ProductEditor, Products } from "./Products";
import { OrderDetail, Orders, Returns } from "./Orders";
import {
  Accounting,
  Purchases,
  Reports,
  ShopSettings,
  Suppliers,
  Rewards,
} from "./Finance";
import { Liabilities } from "./Liabilities";
import "./commerce.css";
// The menu, grouped by what the owner is doing: selling, stock, customers, money.
type NavItem = readonly [path: string, label: string, icon: typeof Store];
const groups: { label: string; items: readonly NavItem[] }[] = [
  { label: "", items: [["", "Overview", LayoutDashboard]] },
  { label: "SELL", items: [["pos", "Point of sale", Store], ["orders", "Orders", Package], ["returns", "Returns & exchanges", ReceiptText], ["promos", "Promo codes", Gift]] },
  { label: "STOCK", items: [["products", "Products", ShoppingBag], ["inventory", "Inventory", Boxes], ["purchases", "Purchases", ShoppingBag], ["suppliers", "Suppliers", Truck]] },
  { label: "MONEY", items: [["reports", "Reports", ChartNoAxesCombined], ["accounting", "Accounting", CircleDollarSign], ["liabilities", "Liabilities", CircleDollarSign]] },
  { label: "WEBSITE", items: [["menu", "Menu & categories", ListTree]] },
  { label: "", items: [["settings", "Settings", Settings]] },
];
const navigation = groups.flatMap((group) => group.items);
// The four places used most, kept one tap away at the bottom of the screen on phones.
const quickBar: readonly NavItem[] = [["pos", "Sell", Store], ["orders", "Orders", Package], ["products", "Products", ShoppingBag], ["inventory", "Stock", Boxes]];
export default function CommerceApp({
  snapshot,
  csrfToken,
  email,
}: {
  snapshot: CommerceSnapshot;
  csrfToken: string;
  email: string;
}) {
  const path = useLocation()
    .pathname.replace(/\/$/, "")
    .slice("/admin".length)
    .split("/")
    .filter(Boolean);
  const section = path[0] || "";
  const itemId = path[1];
  const [menu, setMenu] = useState(false);
  const title = navigation.find((n) => n[0] === section)?.[1] || "Overview";
  let content;
  if (section === "pos") content = <POS data={snapshot} />;
  else if (section === "products")
    content = itemId ? (
      <ProductEditor
        // Remount after the product changes (e.g. saved from the colors modal) so the form never
        // holds stale values that a later save would write back.
        key={`${itemId}:${String(snapshot.products.find((p) => p.id === itemId)?.updatedAt ?? "")}`}
        data={snapshot}
        id={itemId}
      />
    ) : (
      <Products data={snapshot} />
    );
  else if (section === "inventory") content = <Inventory data={snapshot} />;
  else if (section === "orders")
    content = itemId ? (
      <OrderDetail data={snapshot} id={itemId} />
    ) : (
      <Orders data={snapshot} />
    );
  else if (section === "returns") content = <Returns data={snapshot} />;
  else if (section === "suppliers") content = <Suppliers data={snapshot} />;
  else if (section === "purchases") content = <Purchases data={snapshot} />;
  else if (section === "liabilities") content = <Liabilities data={snapshot} />;
  else if (section === "accounting") content = <Accounting data={snapshot} />;
  else if (section === "reports") content = <Reports data={snapshot} />;
  else if (section === "promos" || section === "rewards" || section === "discounts")
    content = <Rewards data={snapshot} />;
  else if (section === "settings") content = <ShopSettings data={snapshot} />;
  else if (section === "menu") content = <MenuCategories data={snapshot} />;
  else content = <Overview data={snapshot} />;
  return (
    <TokenContext.Provider value={csrfToken}>
      <div className={`co-app ${section === "pos" ? "co-pos-app" : ""}`}>
        {menu && (
          <button
            className="co-scrim"
            aria-label="Close navigation"
            onClick={() => setMenu(false)}
          />
        )}
        <aside className={`co-sidebar ${menu ? "is-open" : ""}`}>
          <Link to="/admin" className="co-brand">
            <img
              src="/assets/boys-girlz-logo.webp"
              alt="Boys & Girlz"
              width="150"
              height="50"
            />
            <div>
              Boys & Girlz<small>THE OWNER’S DESK</small>
            </div>
          </Link>
          <div className="co-shop">
            <span className="co-shop-icon">
              <Store size={19} />
            </span>
            <div>
              Your little shop<small>Retail + online · USD</small>
            </div>
            <span className="co-online-dot" />
          </div>
          <nav aria-label="Admin navigation">
            {groups.map((group, index) => (
              <div className="co-nav-group" key={index} role="group" aria-label={group.label || undefined}>
                {group.label && <span className="co-nav-label">{group.label}</span>}
            {group.items.map(([to, label, Icon]) => (
              <NavLink
                key={to}
                to={`/admin${to ? `/${to}` : ""}`}
                end={!to}
                onClick={() => setMenu(false)}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <Icon size={19} />
                <span>{label}</span>
                {to === "inventory" && snapshot.lowStock.length > 0 && (
                  <b>{snapshot.lowStock.length}</b>
                )}
              </NavLink>
            ))}
              </div>
            ))}
          </nav>
          <div className="co-sidebar-bottom">
            <div className="co-local-card">
              <span className="co-online-dot" /> Connected shop
              <small>Supabase · shared inventory</small>
            </div>
            <Form action="/admin/logout" method="post">
              <input type="hidden" name="csrfToken" value={csrfToken} />
              <button type="submit">
                <LogOut size={17} />
                Sign out
              </button>
            </Form>
          </div>
        </aside>
        <div className="co-workspace">
          <header className="co-topbar">
            <div>
              <button
                className="co-icon co-menu"
                aria-label="Toggle navigation"
                onClick={() => setMenu(!menu)}
              >
                {menu ? <X /> : <Menu />}
              </button>
              <span>
                Workspace <b>/</b> <strong>{title}</strong>
              </span>
            </div>
            <div>
              <Link to="/" target="_blank" className="co-store-link">
                View storefront <ArrowUpRight size={15} />
              </Link>
              <span className="co-owner-avatar">O</span>
              <span className="co-owner" title={email}>
                Shop owner<small>Single admin</small>
              </span>
            </div>
          </header>
          <div className="co-demo-banner">
            <span>
              {snapshot.settings.demo
                ? "SAMPLE DATA · TEST SALES"
                : "BOYS & GIRLZ"}
            </span>{" "}
            One shop. One stock pool. USD prices with no tax. Cash and Whish.
          </div>
          <main className="co-main" id="admin-main">
            {content}
          </main>
          <nav className="co-quickbar" aria-label="Quick links">
            {quickBar.map(([to, label, Icon]) => (
              <NavLink key={to} to={`/admin/${to}`} className={({ isActive }) => (isActive ? "active" : "")}>
                <Icon size={20} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
            <button type="button" onClick={() => setMenu(true)} aria-label="All sections">
              <Menu size={20} aria-hidden="true" />
              <span>More</span>
            </button>
          </nav>
          <footer className="co-workspace-footer">
            Made for little adventures.{" "}
            <span>Boys & Girlz · Owner workspace</span>
          </footer>
        </div>
      </div>
    </TokenContext.Provider>
  );
}
