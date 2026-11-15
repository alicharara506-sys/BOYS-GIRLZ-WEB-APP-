import { useEffect, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import type { CommerceSnapshot } from "../../server/commerce/queries.server";
import { sortSizes } from "../../domain/productColors";
import { useCommand } from "./ui";

type ProductRow = CommerceSnapshot["products"][number];

// Quick stock entry: every size × color of one product in one grid, saved together. Each box is
// the number on hand; saving records only what changed. Sizes a color doesn't come in show "—".
export function StockGrid({ product, onSaved }: { product: ProductRow; onSaved?: (changed: number) => void }) {
  const cmd = useCommand();
  const colors = [...new Set(product.variants.map((v) => v.color))];
  const sizes = sortSizes([...new Set(product.variants.map((v) => v.size))]);
  const cell = (size: string, color: string) => product.variants.find((v) => v.size === size && v.color === color);
  const initial = () => Object.fromEntries(product.variants.map((v) => [v.id, String(v.stock)]));
  const [counts, setCounts] = useState<Record<string, string>>(initial);
  const [reason, setReason] = useState<"opening stock" | "correction">(product.variants.every((v) => v.stock === 0) ? "opening stock" : "correction");
  // After a save the page data refreshes; start again from the saved numbers.
  const stockKey = product.variants.map((v) => `${v.id}:${v.stock}`).join(",");
  useEffect(() => setCounts(initial()), [stockKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const changed = (cmd.data?.result as { changed?: number } | undefined)?.changed;
    if (cmd.data?.success && changed !== undefined) onSaved?.(changed);
  }, [cmd.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = (id: string) => counts[id] ?? "0";
  const set = (id: string, next: string) => setCounts((all) => ({ ...all, [id]: next.replace(/[^0-9]/g, "").slice(0, 5) }));
  const step = (id: string, by: number) => set(id, String(Math.max(0, (Number(value(id)) || 0) + by)));
  const changes = product.variants.filter((v) => Number(value(v.id) || 0) !== v.stock);
  const total = product.variants.reduce((sum, v) => sum + (Number(value(v.id)) || 0), 0);
  // Phones get one block per color with a row per size; wider screens get the size × color table.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const counter = (v: ProductRow["variants"][number], label: string) => (
    <div className="sg-cell">
      <button type="button" onClick={() => step(v.id, -1)} aria-label={`One less ${label}`} disabled={(Number(value(v.id)) || 0) <= 0}><Minus size={16} /></button>
      <input inputMode="numeric" pattern="[0-9]*" value={value(v.id)} onChange={(e) => set(v.id, e.target.value)} onFocus={(e) => e.target.select()} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); save(); } }} aria-label={`${label}: units on hand`} />
      <button type="button" onClick={() => step(v.id, 1)} aria-label={`One more ${label}`}><Plus size={16} /></button>
    </div>
  );
  const save = () => {
    if (!changes.length || cmd.busy) return;
    cmd.run("stock-grid", {
      productId: product.id,
      reason,
      counts: changes.map((v) => ({ variantId: v.id, onHand: Number(value(v.id)) || 0 })),
    });
  };

  if (!product.variants.length) return <p className="co-help">This product has no sizes or colors yet.</p>;
  // Stock with no cost is valued at $0 and its sales show no cost of goods, inflating profit.
  const noCost = product.variants.some((v) => v.averageCost === 0) && product.cost === 0;
  return (
    <div className="sg">
      {narrow ? <div className="sg-list">
        {colors.map((color) => <section key={color} className="sg-color" aria-label={color}>
          <h4>{color}</h4>
          {sizes.map((size) => {
            const v = cell(size, color);
            if (!v) return null;
            return <div key={size} className={`sg-row ${Number(value(v.id) || 0) !== v.stock ? "is-dirty" : ""}`}>
              <span>{size}</span>
              {counter(v, `${color} ${size}`)}
            </div>;
          })}
        </section>)}
      </div> : <div className="sg-scroll">
        <table className="sg-table">
          <caption className="sr-only">Units on hand for each size and color of {product.name}</caption>
          <thead>
            <tr><th scope="col">Size</th>{colors.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
          </thead>
          <tbody>
            {sizes.map((size) => <tr key={size}>
              <th scope="row">{size}</th>
              {colors.map((color) => {
                const v = cell(size, color);
                if (!v) return <td key={color} className="sg-none" aria-label={`${color} doesn't come in ${size}`}>—</td>;
                const dirty = Number(value(v.id) || 0) !== v.stock;
                return <td key={color} className={dirty ? "is-dirty" : ""}>{counter(v, `${color} ${size}`)}</td>;
              })}
            </tr>)}
          </tbody>
        </table>
      </div>}
      {noCost && <div className="co-alert warning" role="note">This product has no cost per item yet, so this stock would be valued at $0 and its sales would show full profit. Set the cost first with <strong>Edit colors &amp; photos</strong> or in Pricing below.</div>}
      <div className="sg-foot">
        <label className="co-field sg-reason"><span>This is</span>
          <select value={reason} onChange={(e) => setReason(e.target.value as typeof reason)}>
            <option value="opening stock">New stock arriving / first count</option>
            <option value="correction">A recount (fixing the numbers)</option>
          </select>
        </label>
        <span className="sg-total">{total} units in total{changes.length ? ` · ${changes.length} change${changes.length > 1 ? "s" : ""}` : ""}</span>
        <button type="button" className="co-button primary" onClick={save} disabled={!changes.length || cmd.busy}>
          <Check size={16} /> {cmd.busy ? "Saving…" : "Save stock"}
        </button>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{cmd.busy ? "Saving stock" : cmd.data?.success ? "Stock saved" : ""}</p>
      {cmd.data?.error && <div className="co-alert error" role="alert">{cmd.data.error}</div>}
      {cmd.data?.success && !changes.length && <div className="co-alert success" role="status">Stock saved.</div>}
    </div>
  );
}
