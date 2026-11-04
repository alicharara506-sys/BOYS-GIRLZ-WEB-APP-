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
  Users,
  X,
} from "lucide-react";
import type { CommerceSnapshot } from "../../server/commerce/queries.server";
import { TokenContext } from "./ui";
import Overview from "./Overview";
import POS from "./POS";
import { Inventory, ProductEditor, Products } from "./Products";
import { OrderDetail, Orders, Returns } from "./Orders";
import { CustomerDetail, Customers } from "./Customers";
import {
  Accounting,
  CashDrawer,
  Purchases,
  Reports,
  ShopSettings,
  Suppliers,
  Rewards,
} from "./Finance";
import WhatsAppCampaigns from "./WhatsAppCampaigns";
import { Liabilities } from "./Liabilities";
import "./commerce.css";
const navigation = [
  ["", "Overview", LayoutDashboard],
  ["pos", "Point of sale", Store],
  ["products", "Products", ShoppingBag],
  ["inventory", "Inventory", Boxes],
  ["orders", "Orders", Package],
  ["returns", "Returns & exchanges", ReceiptText],
  ["customers", "Customers", Users],
  ["marketing", "Marketing", Gift],
  ["suppliers", "Suppliers", Truck],
  ["purchases", "Purchases", ShoppingBag],
  ["accounting", "Accounting", CircleDollarSign],
  ["liabilities", "Liabilities", CircleDollarSign],
  ["reports", "Reports", ChartNoAxesCombined],
  ["cash", "Cash drawer", Store],
  ["rewards", "Loyalty & gift cards", Gift],
  ["settings", "Settings", Settings],
] as const;
export default function CommerceApp({
  snapshot,
  csrfToken,
  email,
  whatsapp,
}: {
  snapshot: CommerceSnapshot;
  csrfToken: string;
  email: string;
  whatsapp: { status: string; qr: string };
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
      <ProductEditor key={itemId} data={snapshot} id={itemId} />
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
  else if (section === "customers")
    content = itemId ? (
      <>
        <CustomerDetail key={itemId} data={snapshot} id={itemId} />
        {itemId !== "new" && (
          <WhatsAppCampaigns
            data={snapshot}
            connection={whatsapp}
            customerId={itemId}
          />
        )}
      </>
    ) : (
      <Customers data={snapshot} />
    );
  else if (section === "marketing")
    content = <WhatsAppCampaigns data={snapshot} connection={whatsapp} />;
  else if (section === "suppliers") content = <Suppliers data={snapshot} />;
  else if (section === "purchases") content = <Purchases data={snapshot} />;
  else if (section === "liabilities") content = <Liabilities data={snapshot} />;
  else if (section === "accounting") content = <Accounting data={snapshot} />;
  else if (section === "reports") content = <Reports data={snapshot} />;
  else if (section === "cash") content = <CashDrawer data={snapshot} />;
  else if (section === "rewards" || section === "discounts")
    content = <Rewards data={snapshot} />;
  else if (section === "settings") content = <ShopSettings data={snapshot} />;
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
          <span className="co-nav-label">WORKSPACE</span>
          <nav aria-label="Admin navigation">
            {navigation.map(([to, label, Icon]) => (
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
          <footer className="co-workspace-footer">
            Made for little adventures.{" "}
            <span>Boys & Girlz · Owner workspace</span>
          </footer>
        </div>
      </div>
    </TokenContext.Provider>
  );
}
