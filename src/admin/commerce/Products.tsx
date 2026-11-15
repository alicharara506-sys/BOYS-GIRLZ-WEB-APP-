import { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Barcode, Plus, Search, Upload } from "lucide-react";
import type { CommerceSnapshot } from "../../server/commerce/queries.server";
import {
  amount,
  Badge,
  Check,
  CommandForm,
  Download,
  Empty,
  Feedback,
  Field,
  flag,
  Modal,
  num,
  Panel,
  PrintButton,
  Select,
  str,
  TokenContext,
  usd,
  useCommand,
} from "./ui";
import { InlineSelect } from "./InlineSelect";
import { finalPrice } from "../../domain/pricing";
import { useSearchParams } from "react-router";
import JsBarcode from "jsbarcode";
import { AddProductModal } from "./AddProductModal";
import { StockGrid } from "./StockGrid";
type Props = { data: CommerceSnapshot };
export function Products({ data }: Props) {
  const [query, setQuery] = useState("");
  const [archived, setArchived] = useState(false);
  const [adding, setAdding] = useState(false);
  const [created, setCreated] = useState("");
  const cmd = useCommand();
  const products = data.products.filter(
    (p) =>
      p.archived === archived &&
      `${p.name} ${p.brand} ${p.category}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="co-page-head">
        <div>
          <p className="co-eyebrow">THE LITTLE COLLECTION</p>
          <h1>
            Products<span>.</span>
          </h1>
          <p>Every size, color, and channel in one place.</p>
        </div>
        <div className="co-head-actions">
          <Link to="/admin/products/new" className="co-button">
            Full editor
          </Link>
          <button type="button" className="co-button primary" onClick={() => setAdding(true)}>
            <Plus size={17} />
            Add product
          </button>
        </div>
      </div>
      {adding && (
        <AddProductModal
          data={data}
          onClose={() => setAdding(false)}
          onCreated={(id) => {
            setAdding(false);
            setCreated(id);
          }}
        />
      )}
      {/* Straight after creating a product: enter how many of each size and color you have. */}
      {created && data.products.some((p) => p.id === created) && (
        <Modal title={`Stock for ${data.products.find((p) => p.id === created)!.name}`} onClose={() => setCreated("")} className="co-modal-wizard">
          <div className="apm-step">
            <p className="apm-note">Product created. Now enter how many you have of each size and color, or close this and do it later from the product page.</p>
            <StockGrid product={data.products.find((p) => p.id === created)!} onSaved={() => setCreated("")} />
          </div>
        </Modal>
      )}
      <Feedback data={cmd.data} />
      <Panel>
        <div className="co-toolbar">
          <div className="co-search">
            <Search size={17} />
            <input
              aria-label="Search products"
              placeholder="Search your collection…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            className={`co-button ${archived ? "active" : ""}`}
            onClick={() => setArchived(!archived)}
          >
            {archived ? "Show active" : "Archived products"}
          </button>
          <Download kind="products" label="Export CSV" />
        </div>
        <div className="co-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>In-store / Online</th>
                <th>Stock</th>
                <th>Publishing</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link
                      to={`/admin/products/${p.id}`}
                      className="co-product-cell"
                    >
                      <img
                        src={
                          p.imageUrl ||
                          `/assets/catalog-previews/${p.imageIndex}.webp`
                        }
                        alt=""
                      />
                      <span>
                        <strong>{p.name}</strong>
                        <small>
                          {p.brand} ·{" "}
                          {p.gender === "Girls" ? "Girlz" : p.gender}
                          {p.demo ? " · Sample" : ""}
                        </small>
                      </span>
                    </Link>
                  </td>
                  <td>{p.category}</td>
                  <td>
                    <strong>{usd(finalPrice(p.price, p))}</strong> /{" "}
                    {usd(finalPrice(p.onlinePrice, p))}
                  </td>
                  <td>
                    {p.variants.reduce((s, v) => s + v.stock, 0)} units
                    <small>{p.variants.length} variants</small>
                  </td>
                  <td>
                    <Badge tone={p.published ? "green" : ""}>
                      {p.archived
                        ? "Archived"
                        : p.published
                          ? "Online"
                          : "Hidden"}
                    </Badge>
                    {p.featured && <small>Featured</small>}
                  </td>
                  <td>
                    <button
                      className="co-text-link"
                      onClick={() =>
                        cmd.run("archive", { id: p.id, archived: !p.archived })
                      }
                    >
                      {p.archived ? "Restore" : "Archive"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!products.length && <Empty>No products match this view.</Empty>}
        </div>
      </Panel>
    </>
  );
}
export function ProductEditor({ data, id }: Props & { id: string }) {
  const product = data.products.find((p) => p.id === id);
  const cmd = useCommand();
  const [preview, setPreview] = useState(product?.imageUrl || "");
  const [editingColors, setEditingColors] = useState(false);
  const [colorsSaved, setColorsSaved] = useState(false);
  const token = useContext(TokenContext);
  const [params] = useSearchParams();
  const [shopId, setShopId] = useState(
    product?.shopId || data.shops[0]?.id || "",
  );
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ||
      data.categories.find((c) => c.name === params.get("category"))?.id ||
      "",
  );
  if (id !== "new" && !product) return <Empty>Product not found.</Empty>;
  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      id: product?.id,
      name: str(form, "name"),
      slug: str(form, "slug"),
      description: str(form, "description"),
      category:
        data.categories.find((c) => c.id === categoryId)?.name || "Unlisted",
      categoryId,
      shopId,
      visibility: str(form, "visibility"),
      discountType: str(form, "discountType") || null,
      discountValue:
        str(form, "discountType") === "percentage"
          ? num(form, "discountValue")
          : amount(form.get("discountValue")),
      gender: str(form, "gender"),
      brand: str(form, "brand"),
      season: str(form, "season"),
      imageUrl: str(form, "imageUrl"),
      imageIndex: num(form, "imageIndex"),
      price: amount(form.get("price")),
      onlinePrice: amount(form.get("onlinePrice")),
      cost: amount(form.get("cost")),
      threshold: num(form, "threshold"),

      featured: flag(form, "featured"),

      sizes: str(form, "sizes")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      colors: str(form, "colors")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    form.set("payload", JSON.stringify(payload));
    form.set("intent", "product");
    form.set("csrfToken", token);
    cmd.fetcher.submit(form, {
      method: "post",
      action: "/admin",
      encType: "multipart/form-data",
    });
  };
  return (
    <>
      <div className="co-page-head">
        <div>
          <p className="co-eyebrow">
            <Link to="/admin/products">COLLECTION</Link> / PRODUCT DETAILS
          </p>
          <h1>
            {product ? "Edit product" : "New product"}
            <span>.</span>
          </h1>
          <p>
            Save first, then enter stock in the grid below. Product URLs stay
            permanent.
          </p>
        </div>
        <div className="co-head-actions">
          {product && (
            <button type="button" className="co-button primary" onClick={() => { setColorsSaved(false); setEditingColors(true); }}>
              Edit colors & photos
            </button>
          )}
          <Link className="co-button" to="/admin/products">
            Back to products
          </Link>
        </div>
      </div>
      {/* The guided modal edits details, colors, photos, per-color sizes and availability; this
          page keeps the advanced fields (cost, in-store price, barcodes, visibility). */}
      {editingColors && product && (
        <AddProductModal data={data} product={product} onClose={() => setEditingColors(false)} onCreated={() => { setEditingColors(false); setColorsSaved(true); }} />
      )}
      {colorsSaved && <div className="co-alert success" role="status">Colors and photos saved.</div>}
      <Feedback data={cmd.data} />
      {cmd.data?.result?.id && !product && (
        <Link
          className="co-button primary"
          to={`/admin/products/${cmd.data.result.id}`}
        >
          Open saved product
        </Link>
      )}
      <form className="co-editor-layout" onSubmit={save}>
        <div>
          <Panel title="The essentials">
            <div className="co-form co-two">
              <Field
                name="name"
                label="Product name"
                value={product?.name || params.get("name") || ""}
                required
              />
              <Field
                name="slug"
                label="Product URL slug"
                value={product?.slug}
                required
                hint="Lowercase letters, numbers, and dashes"
              />
              <InlineSelect
                kind="shop"
                value={shopId}
                onChange={(id) => {
                  setShopId(id);
                  setCategoryId("");
                }}
                options={data.shops}
              />
              <InlineSelect
                kind="category"
                value={categoryId}
                onChange={setCategoryId}
                options={data.categories.filter((c) => c.shopId === shopId)}
                shopId={shopId}
              />
              <Select
                name="gender"
                label="Shop for"
                value={product?.gender}
                options={[
                  { value: "Boys", label: "Boys" },
                  { value: "Girls", label: "Girlz" },
                  { value: "Unisex", label: "Unisex" },
                ]}
              />
              <Field
                name="brand"
                label="Brand"
                value={product?.brand || "Boys & Girlz"}
                required
              />
              <Select
                name="season"
                label="Season"
                value={product?.season}
                options={[
                  "All season",
                  "Spring / Summer",
                  "Autumn / Winter",
                  "Back to school",
                ]}
              />
              <label className="co-field co-wide">
                <span>Description</span>
                <textarea
                  name="description"
                  defaultValue={product?.description}
                  rows={4}
                />
              </label>
            </div>
          </Panel>
          {product && (
            <Panel title="Stock on hand" subtitle="Type the count for each size and color, then save once.">
              <StockGrid key={product.id} product={product} />
            </Panel>
          )}
          <Panel title="Pricing & stock">
            <div className="co-form co-two">
              <Field
                name="price"
                label="In-store price $"
                type="number"
                min={0}
                step="0.01"
                value={
                  product
                    ? product.price / 100
                    : Number(params.get("price") || 0) / 100
                }
                required
              />
              <Field
                name="onlinePrice"
                label="Online price $"
                type="number"
                min={0}
                step="0.01"
                value={
                  product
                    ? product.onlinePrice / 100
                    : Number(params.get("price") || 0) / 100
                }
                required
              />
              <Field
                name="cost"
                label="Default purchase cost $"
                type="number"
                min={0}
                step="0.01"
                value={(product?.cost || 0) / 100}
              />
              <Field
                name="threshold"
                label="Low-stock threshold per variant"
                type="number"
                min={0}
                step="1"
                value={product?.threshold ?? 5}
              />
              <Field
                name="sizes"
                label="Age sizes (comma separated)"
                value={
                  product
                    ? [...new Set(product.variants.map((v) => v.size))].join(
                        ", ",
                      )
                    : "0–3 Months, 3–6 Months, 6–9 Months, 9–12 Months, 12–18 Months, 18–24 Months, 2–3 Years, 3–4 Years, 4–5 Years, 5–6 Years, 6–7 Years, 7–8 Years, 8–9 Years, 9–10 Years, 10–12 Years, 12–14 Years"
                }
                required
              />
              <Field
                name="colors"
                label="Colors (comma separated)"
                value={
                  product
                    ? [...new Set(product.variants.map((v) => v.color))].join(
                        ", ",
                      )
                    : "Blue, Pink, Cream"
                }
                required
              />
            </div>
            <p className="co-help">
              Every size × color creates its own SKU, barcode, and stock
              balance. Existing variant identifiers and stock are preserved.
            </p>
          </Panel>
        </div>
        <aside>
          <Panel title="Product photo">
            <div className="co-editor-photo">
              <img
                src={
                  preview ||
                  `/assets/catalog-previews/${product?.imageIndex || 0}.webp`
                }
                alt="Product preview"
              />
            </div>
            <label className="co-upload">
              <Upload size={20} />
              <span>
                Upload a product image
                <small>JPG, PNG, WebP or GIF · up to 5 MB</small>
              </span>
              <input
                name="imageFile"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPreview(URL.createObjectURL(f));
                }}
              />
            </label>
            <Field
              name="imageUrl"
              label="Or HTTPS image URL"
              value={product?.imageUrl || ""}
            />
            <input
              name="imageIndex"
              type="hidden"
              value={product?.imageIndex || 0}
            />
          </Panel>
          <Panel title="Online visibility">
            <div className="co-form">
              <Select
                name="visibility"
                label="Sell on"
                value={product?.visibility || "website_and_pos"}
                options={[
                  { value: "website_and_pos", label: "Website and POS" },
                  { value: "pos_only", label: "POS only" },
                ]}
              />
              <Check
                name="featured"
                label="Featured favorite"
                value={product?.featured}
              />
              <Select
                name="discountType"
                label="Product discount"
                value={product?.discountType || ""}
                options={[
                  { value: "", label: "None" },
                  { value: "percentage", label: "Percentage" },
                  { value: "amount", label: "Fixed amount $" },
                ]}
              />
              <Field
                name="discountValue"
                label="Discount value (% or $)"
                type="number"
                min={0}
                step="0.01"
                value={
                  product?.discountType === "percentage"
                    ? product.discountValue
                    : (product?.discountValue || 0) / 100
                }
              />
              <p className="co-help">
                POS and website orders always use the same stock.
              </p>
              <button
                className="co-button primary"
                type="submit"
                disabled={cmd.busy}
              >
                {cmd.busy ? "Saving…" : "Save product"}
              </button>
            </div>
          </Panel>
        </aside>
      </form>
      {product && (
        <Panel title="Variant identifiers">
          <div className="co-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Size / Color</th>
                  <th>SKU</th>
                  <th>Barcode</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {product.variants.map((v) => (
                  <tr key={v.id}>
                    <td>
                      {v.size} · {v.color}
                    </td>
                    <td colSpan={3}>
                      <CommandForm
                        intent="variant-identifiers"
                        className="co-inline"
                        build={(f) => ({
                          id: v.id,
                          sku: str(f, "sku"),
                          barcode: str(f, "barcode"),
                        })}
                        label="Update"
                      >
                        <input
                          aria-label={`SKU ${v.size} ${v.color}`}
                          name="sku"
                          defaultValue={v.sku}
                          required
                        />
                        <input
                          aria-label={`Barcode ${v.size} ${v.color}`}
                          name="barcode"
                          defaultValue={v.barcode}
                          required
                        />
                      </CommandForm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </>
  );
}
function LabelBarcode({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (ref.current)
      JsBarcode(ref.current, value, {
        format: "CODE128",
        width: 1.3,
        height: 38,
        fontSize: 11,
        margin: 4,
      });
  }, [value]);
  return <svg ref={ref} aria-label={`Barcode ${value}`} />;
}
export function Inventory({ data }: Props) {
  const [query, setQuery] = useState("");
  const [low, setLow] = useState(false);
  const [adjust, setAdjust] = useState<string | null>(null);
  const [labels, setLabels] = useState(false);
  // "products": one card per product with its stock grid (easiest on a phone).
  // "table": every size × color as a row, with SKU, barcode and cost.
  const [view, setView] = useState<"products" | "table">("products");
  const [open, setOpen] = useState<string | null>(null);
  const variants = data.products
    .filter((p) => !p.archived)
    .flatMap((p) => p.variants.map((v) => ({ ...v, product: p })))
    .filter(
      (v) =>
        (!low || v.stock <= v.product.threshold) &&
        `${v.product.name} ${v.sku} ${v.barcode} ${v.size} ${v.color}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
  const current = variants.find((v) => v.id === adjust);
  return (
    <>
      <div className="co-page-head">
        <div>
          <p className="co-eyebrow">ONE STOCK POOL, EVERY CHANNEL</p>
          <h1>
            Inventory<span>.</span>
          </h1>
          <p>
            Every change leaves a trail. Sales from both channels update these
            balances.
          </p>
        </div>
        <div className="co-actions">
          <Download kind="inventory" label="Export inventory" />
          <button className="co-button" onClick={() => setLabels(true)}>
            <Barcode size={17} />
            Print labels
          </button>
        </div>
      </div>
      <Panel>
        <div className="co-toolbar">
          <div className="co-search">
            <Search size={17} />
            <input
              aria-label="Search inventory"
              placeholder="Search product, SKU, size or color…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            className={`co-button ${low ? "active" : ""}`}
            onClick={() => setLow(!low)}
          >
            Low stock ({data.lowStock.length})
          </button>
          <div className="inv-view" role="group" aria-label="View">
            <button type="button" className={`co-button ${view === "products" ? "active" : ""}`} aria-pressed={view === "products"} onClick={() => setView("products")}>By product</button>
            <button type="button" className={`co-button ${view === "table" ? "active" : ""}`} aria-pressed={view === "table"} onClick={() => setView("table")}>Detailed table</button>
          </div>
        </div>
        {view === "products" && (
          <div className="inv-cards">
            {data.products
              .filter((p) => !p.archived && variants.some((v) => v.productId === p.id))
              .map((p) => {
                const units = p.variants.reduce((sum, v) => sum + v.stock, 0);
                const lowCount = p.variants.filter((v) => v.stock <= p.threshold).length;
                const isOpen = open === p.id;
                return (
                  <article key={p.id} className={`inv-card ${isOpen ? "is-open" : ""}`}>
                    <button type="button" className="inv-card-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : p.id)}>
                      <img src={p.imageUrl || `/assets/catalog-previews/${p.imageIndex}.webp`} alt="" />
                      <span>
                        <strong>{p.name}</strong>
                        <small>{new Set(p.variants.map((v) => v.color)).size} colors · {new Set(p.variants.map((v) => v.size)).size} sizes</small>
                      </span>
                      <span className="inv-units">
                        <b>{units}</b> units
                        {lowCount > 0 && <Badge tone="amber">{lowCount} low</Badge>}
                      </span>
                    </button>
                    {isOpen && <div className="inv-card-body"><StockGrid product={p} /></div>}
                  </article>
                );
              })}
            {!variants.length && <Empty>No inventory matches this view.</Empty>}
          </div>
        )}
        {view === "table" && <div className="co-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product / Variant</th>
                <th>SKU / Barcode</th>
                <th>Available</th>
                <th>Threshold</th>
                <th>Suggested reorder</th>
                <th>Average cost</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id}>
                  <td>
                    <strong>{v.product.name}</strong>
                    <small>
                      {v.size} · {v.color}
                    </small>
                  </td>
                  <td>
                    {v.sku}
                    <small>{v.barcode}</small>
                  </td>
                  <td>
                    <Badge
                      tone={v.stock <= v.product.threshold ? "amber" : "green"}
                    >
                      {v.stock} units
                    </Badge>
                  </td>
                  <td>{v.product.threshold}</td>
                  <td>
                    {v.stock <= v.product.threshold
                      ? Math.max(0, v.product.threshold * 2 - v.stock)
                      : "—"}
                  </td>
                  <td>{usd(v.averageCost)}</td>
                  <td>
                    <button
                      className="co-text-link"
                      onClick={() => setAdjust(v.id)}
                    >
                      Adjust
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!variants.length && <Empty>No inventory matches this view.</Empty>}
        </div>}
      </Panel>
      <Panel title="Recent stock movements">
        <div className="co-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Change</th>
                <th>Reason</th>
                <th>Reference</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {data.movements.slice(0, 15).map((m) => (
                <tr key={m.id}>
                  <td>
                    {m.variant.product.name}
                    <small>
                      {m.variant.size} · {m.variant.color}
                    </small>
                  </td>
                  <td>
                    {m.quantity > 0 ? "+" : ""}
                    {m.quantity}
                  </td>
                  <td>{m.reason}</td>
                  <td className="co-reference">{m.reference}</td>
                  <td>{new Date(m.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {current && (
        <Modal
          title={`Adjust ${current.product.name}`}
          onClose={() => setAdjust(null)}
        >
          <p>
            {current.size} · {current.color} · Current stock: {current.stock}
          </p>
          <CommandForm
            intent="adjust-stock"
            build={(f) => ({
              variantId: current.id,
              quantity: num(f, "quantity"),
              reason: str(f, "reason"),
              note: str(f, "note"),
            })}
          >
            <Field
              name="quantity"
              label="Units to add / remove (negative removes stock)"
              type="number"
              step="1"
              required
            />
            <Select
              name="reason"
              label="Reason"
              options={["damage", "theft", "correction", "opening stock"]}
            />
            <Field name="note" label="Explanation" required />
          </CommandForm>
        </Modal>
      )}
      {labels && (
        <Modal title="Barcode labels" onClose={() => setLabels(false)}>
          <p>
            Printing the {variants.length} variants in the current filtered
            view.
          </p>
          <PrintButton label="Print labels" />
          <div className="co-label-sheet">
            {variants.map((v) => (
              <div className="co-label" key={v.id}>
                <strong>{v.product.name}</strong>
                <small>
                  {v.size} · {v.color} · {usd(v.product.price)}
                </small>
                <LabelBarcode value={v.barcode} />
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
