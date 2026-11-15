import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, LoaderCircle, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import type { CommerceSnapshot } from "../../server/commerce/queries.server";
import { Badge, Feedback, Modal, Panel, useCommand } from "./ui";
import MenuIcon from "../../components/MenuIcon";
import {
  MENU_ICONS, PAGES, RESERVED_SLUGS, SECTIONS, safeLink, slugify,
  type MenuItem, type PageKey, type SectionKey, type SiteMenu,
} from "../../domain/menu";

type Props = { data: CommerceSnapshot };
type Category = CommerceSnapshot["categories"][number];
type List = "shop" | "top";

// Menu & categories: the owner adds product categories (each gets its own page on the website) and
// arranges the website menu: the Shop drop-down and the links next to it.
export default function MenuCategories({ data }: Props) {
  return (
    <>
      <div className="co-page-head">
        <div>
          <p className="co-eyebrow">YOUR WEBSITE</p>
          <h1>Menu & categories<span>.</span></h1>
          <p>Add categories for your products and choose what shows in the website menu, in English and Arabic.</p>
        </div>
      </div>
      <Categories data={data} />
      <MenuEditor data={data} />
    </>
  );
}

function Categories({ data }: Props) {
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const cmd = useCommand();
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of data.products) if (!p.archived && p.categoryId) map.set(p.categoryId, (map.get(p.categoryId) || 0) + 1);
    return map;
  }, [data.products]);
  const inMenu = new Set([...data.menu.shop, ...data.menu.top].filter((i) => i.kind === "category").map((i) => i.target));
  const remove = (category: Category) => {
    if (window.confirm(`Delete the category "${category.name}"? This can't be undone.`)) cmd.run("category-delete", { id: category.id });
  };
  return (
    <Panel
      title="Categories"
      subtitle="Every product is filed under one category. Each category has its own page on the website, which shows once it has products."
      action={<button className="co-button primary" type="button" onClick={() => setEditing("new")}><Plus size={16} /> Add category</button>}
    >
      <Feedback data={cmd.data} />
      <div className="co-table-wrap">
        <table>
          <thead>
            <tr><th>Category</th><th>Arabic</th><th>Web page</th><th>Products</th><th>Menu</th><th /></tr>
          </thead>
          <tbody>
            {data.categories.map((c) => {
              const count = counts.get(c.id) || 0;
              const builtIn = RESERVED_SLUGS.has(c.slug);
              return (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td dir="rtl">{c.nameAr || <span className="co-help">—</span>}</td>
                  <td><code>/category/{c.slug}</code></td>
                  <td>{count}</td>
                  <td>{builtIn ? <Badge>Built-in section</Badge> : inMenu.has(c.id) ? <Badge tone="green">In the menu</Badge> : <Badge>Not in the menu</Badge>}</td>
                  <td className="co-actions">
                    <button className="co-button" type="button" onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`}><Pencil size={15} /> Edit</button>
                    <button className="co-button" type="button" onClick={() => remove(c)} disabled={count > 0 || cmd.busy}
                      title={count > 0 ? "Move its products to another category before deleting it." : undefined} aria-label={`Delete ${c.name}`}><Trash2 size={15} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {editing && <CategoryForm category={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </Panel>
  );
}

function CategoryForm({ category, onClose }: { category: Category | null; onClose: () => void }) {
  const cmd = useCommand();
  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const address = slugTouched ? slugify(slug) : slugify(name);
  // Close once saved.
  useEffect(() => { if (cmd.data?.success) onClose(); }, [cmd.data, onClose]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    cmd.run("category-save", {
      id: category?.id,
      name: String(f.get("name") || ""),
      nameAr: String(f.get("nameAr") || ""),
      slug: address,
      intro: String(f.get("intro") || ""),
      introAr: String(f.get("introAr") || ""),
      addToMenu: !category && f.get("addToMenu") === "on",
    });
  };
  return (
    <Modal title={category ? `Edit ${category.name}` : "Add a category"} onClose={onClose}>
      <form className="co-form" onSubmit={submit}>
        <Feedback data={cmd.data} />
        <div className="co-form co-two">
          <label className="co-field"><span>Name (English)</span>
            <input name="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} placeholder="Shoes" /></label>
          <label className="co-field"><span>Name (Arabic)</span>
            <input name="nameAr" defaultValue={category?.nameAr} maxLength={60} dir="rtl" placeholder="أحذية" /></label>
        </div>
        <label className="co-field"><span>Web address</span>
          <input value={slugTouched ? slug : address} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} maxLength={60} placeholder="shoes" />
          <small>The page will be at <code>/category/{address || "…"}</code>. English letters, numbers and dashes.{category && " Changing it changes the page's address."}</small></label>
        <label className="co-field"><span>Short intro (English, optional)</span>
          <textarea name="intro" defaultValue={category?.intro} maxLength={600} rows={2} placeholder="Comfy first shoes and sandals for little feet, sizes 16 to 30." /></label>
        <label className="co-field"><span>Short intro (Arabic, optional)</span>
          <textarea name="introAr" defaultValue={category?.introAr} maxLength={600} rows={2} dir="rtl" /></label>
        {!category && <label className="co-check"><input type="checkbox" name="addToMenu" defaultChecked /> Show it in the website's Shop menu</label>}
        {category && category.name !== name && <p className="co-help">Products in this category will show the new name.</p>}
        <div className="co-actions">
          <button className="co-button" type="button" onClick={onClose}>Cancel</button>
          <button className="co-button primary" type="submit" disabled={cmd.busy || !name.trim()}>
            {cmd.busy ? <><LoaderCircle className="animate-spin" size={16} /> Saving…</> : category ? "Save category" : "Add category"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// The default name of an entry, shown when the owner leaves the label empty.
function defaultLabel(item: MenuItem, categories: Category[]) {
  if (item.kind === "section") return SECTIONS[item.target as SectionKey]?.label || item.target;
  if (item.kind === "page") return PAGES[item.target as PageKey]?.label || item.target;
  if (item.kind === "category") return categories.find((c) => c.id === item.target)?.name || "Deleted category";
  return "";
}
function defaultIcon(item: MenuItem) {
  return item.icon || (item.kind === "section" ? SECTIONS[item.target as SectionKey]?.icon : item.kind === "category" ? "tag" : "heart") || "tag";
}
const kindName = { section: "Section", category: "Category", page: "Page", link: "Link" } as const;

function MenuEditor({ data }: Props) {
  const cmd = useCommand();
  const [menu, setMenu] = useState<SiteMenu>(data.menu);
  const [dirty, setDirty] = useState(false);
  // After a save, start again from what the server stored.
  useEffect(() => { setMenu(data.menu); setDirty(false); }, [data.menu]);
  const update = (list: List, next: MenuItem[]) => { setMenu((m) => ({ ...m, [list]: next })); setDirty(true); };
  const save = () => cmd.run("menu-save", menu);
  const reset = () => {
    if (window.confirm("Go back to the original menu? Your categories stay; only the menu is reset.")) cmd.run("menu-save", { reset: true });
  };
  const linkProblem = [...menu.shop, ...menu.top].some((i) => i.kind === "link" && (!i.label || !safeLink(i.target)));
  return (
    <Panel
      title="Website menu"
      subtitle="Use the arrows to change the order. Hidden items stay here but don't show on the website. Sections and categories with no products are hidden automatically until they have some."
      action={<div className="co-head-actions">
        <button className="co-button" type="button" onClick={reset} disabled={cmd.busy || !data.menuSaved}><RotateCcw size={15} /> Original menu</button>
        <button className="co-button primary" type="button" onClick={save} disabled={cmd.busy || !dirty || linkProblem}>
          {cmd.busy ? <><LoaderCircle className="animate-spin" size={16} /> Saving…</> : "Save menu"}
        </button>
      </div>}
    >
      <Feedback data={cmd.data} />
      {dirty && <p className="co-alert">You have changes that aren't saved yet.</p>}
      <MenuList title="Shop drop-down" help="Shown under “Shop” in the header, in the phone menu and in the footer." list="shop" items={menu.shop} data={data} onChange={(next) => update("shop", next)} />
      <MenuList title="Header links" help="Shown next to “Shop” in the header and in the phone menu." list="top" items={menu.top} data={data} onChange={(next) => update("top", next)} />
    </Panel>
  );
}

function MenuList({ title, help, list, items, data, onChange }: { title: string; help: string; list: List; items: MenuItem[]; data: CommerceSnapshot; onChange: (next: MenuItem[]) => void }) {
  const [adding, setAdding] = useState("");
  const set = (index: number, patch: Partial<MenuItem>) => onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const move = (index: number, by: number) => {
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(index + by, 0, moved);
    onChange(next);
  };
  const add = () => {
    if (!adding) return;
    const [kind, target] = adding.split(":") as [MenuItem["kind"], string];
    onChange([...items, { kind, target: kind === "link" ? "/" : target, label: "", labelAr: "", icon: "", color: "", visible: true }]);
    setAdding("");
  };
  const used = new Set(items.map((i) => `${i.kind}:${i.target}`));
  return (
    <div className="co-menu-list">
      <h3>{title}</h3>
      <p className="co-help">{help}</p>
      <div className="co-table-wrap">
        <table>
          <thead>
            <tr><th>Order</th><th>Item</th><th>English label</th><th>Arabic label</th>{list === "shop" && <th>Icon & colour</th>}<th>Show</th><th /></tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const fallback = defaultLabel(item, data.categories);
              const fallbackAr = item.kind === "category" ? data.categories.find((c) => c.id === item.target)?.nameAr || "" : "";
              const color = item.color || (item.kind === "section" ? SECTIONS[item.target as SectionKey]?.color : "") || "#fc538e";
              return (
                <tr key={`${item.kind}-${item.target}-${index}`} className={item.visible ? "" : "co-muted-row"}>
                  <td className="co-actions">
                    <button className="co-button" type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${fallback || item.label} up`}><ArrowUp size={14} /></button>
                    <button className="co-button" type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={`Move ${fallback || item.label} down`}><ArrowDown size={14} /></button>
                  </td>
                  <td>
                    <Badge>{kindName[item.kind]}</Badge>{" "}
                    {item.kind === "link"
                      ? <input aria-label="Link address" value={item.target} onChange={(e) => set(index, { target: e.target.value.trim() })} placeholder="/help/sizing or https://…" maxLength={300}
                          aria-invalid={!safeLink(item.target)} />
                      : <strong>{fallback}</strong>}
                  </td>
                  <td><input aria-label="English label" value={item.label} onChange={(e) => set(index, { label: e.target.value })} placeholder={fallback || "Required"} maxLength={40} aria-invalid={item.kind === "link" && !item.label} /></td>
                  <td><input aria-label="Arabic label" dir="rtl" value={item.labelAr} onChange={(e) => set(index, { labelAr: e.target.value })} placeholder={fallbackAr || "تلقائي"} maxLength={40} /></td>
                  {list === "shop" && <td>
                    <span className="co-inline">
                      <span className="co-menu-icon" style={{ color }} aria-hidden="true"><MenuIcon name={defaultIcon(item)} size={16} /></span>
                      <select aria-label="Icon" value={item.icon} onChange={(e) => set(index, { icon: e.target.value })}>
                        <option value="">Default</option>
                        {MENU_ICONS.map((name) => <option key={name} value={name}>{name.replace("-", " ")}</option>)}
                      </select>
                      <input type="color" aria-label="Colour" value={color} onChange={(e) => set(index, { color: e.target.value })} />
                    </span>
                  </td>}
                  <td>
                    <button className="co-button" type="button" onClick={() => set(index, { visible: !item.visible })} aria-pressed={item.visible} aria-label={item.visible ? "Hide from the website" : "Show on the website"}>
                      {item.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  </td>
                  <td><button className="co-button" type="button" onClick={() => onChange(items.filter((_, i) => i !== index))} aria-label={`Remove ${fallback || item.label}`}><Trash2 size={15} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="co-inline">
        <select aria-label={`Add to ${title}`} value={adding} onChange={(e) => setAdding(e.target.value)}>
          <option value="">Add an item…</option>
          <optgroup label="Sections">
            {(Object.keys(SECTIONS) as SectionKey[]).map((key) => <option key={key} value={`section:${key}`} disabled={used.has(`section:${key}`)}>{SECTIONS[key].label}</option>)}
          </optgroup>
          <optgroup label="Your categories">
            {data.categories.filter((c) => !RESERVED_SLUGS.has(c.slug)).map((c) => <option key={c.id} value={`category:${c.id}`} disabled={used.has(`category:${c.id}`)}>{c.name}</option>)}
          </optgroup>
          <optgroup label="Pages">
            {(Object.keys(PAGES) as PageKey[]).map((key) => <option key={key} value={`page:${key}`} disabled={used.has(`page:${key}`)}>{PAGES[key].label}</option>)}
          </optgroup>
          <option value="link:">A link you type in…</option>
        </select>
        <button className="co-button" type="button" onClick={add} disabled={!adding}><Plus size={15} /> Add</button>
      </div>
    </div>
  );
}

