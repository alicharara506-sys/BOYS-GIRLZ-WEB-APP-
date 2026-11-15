import { useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, ImagePlus, Layers, LoaderCircle, Palette, Plus, Star, Trash2 } from "lucide-react";
import type { CommerceSnapshot } from "../../server/commerce/queries.server";
import { Modal, TokenContext, useCommand } from "./ui";
import {
  IMAGE_TYPES,
  MAX_COLORS,
  MAX_IMAGES_PER_COLOR,
  SIZE_ORDER,
  imageFileIssue,
  normalizeHex,
  productSlug,
  sortSizes,
  validateBasics,
  validateColors,
  type ColorDraftIssue,
  type ColorMode,
  type ProductBasics,
} from "../../domain/productColors";

// The sizes the shop sells, in order.
const SIZES = SIZE_ORDER;
const STARTER_SWATCHES = ["#e6afb3", "#9bbbd7", "#f5f1e8", "#b6c8b4", "#e7c777", "#2b2b2b"];
const STEPS = ["Color type", "Details", "Colors", "Review"];

type Photo = { id: string; preview: string; url?: string; file?: string; status: "uploading" | "done" | "error"; progress: number; error?: string };
// sizes: null means the color comes in every size of the product; a list means only those.
type ColorCard = { key: string; name: string; nameAr: string; hex: string; photos: Photo[]; available: boolean; sizes: string[] | null };

let counter = 0;
const uid = () => `c${Date.now().toString(36)}${(counter++).toString(36)}`;
const newColor = (index: number): ColorCard => ({ key: uid(), name: "", nameAr: "", hex: STARTER_SWATCHES[index % STARTER_SWATCHES.length], photos: [], available: true, sizes: null });

// Sends one photo to /admin/media and reports upload progress.
function sendPhoto(file: File, token: string, onProgress: (percent: number) => void): Promise<{ url: string; file: string }> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.set("csrfToken", token);
    body.set("intent", "upload");
    body.set("imageFile", file);
    const request = new XMLHttpRequest();
    request.open("POST", "/admin/media");
    request.upload.onprogress = (event) => event.lengthComputable && onProgress(Math.round((event.loaded / event.total) * 100));
    request.onload = () => {
      let reply: { url?: string; file?: string; error?: string } = {};
      try { reply = JSON.parse(request.responseText); } catch { /* handled below */ }
      if (request.status === 200 && reply.url && reply.file) resolve({ url: reply.url, file: reply.file });
      else reject(new Error(reply.error || "The photo could not be uploaded."));
    };
    request.onerror = () => reject(new Error("Network error while uploading."));
    request.send(body);
  });
}
// Deletes photos uploaded here but never saved with a product (the server keeps any in use).
function discardPhotos(files: string[], token: string) {
  for (const file of files) {
    const body = new FormData();
    body.set("csrfToken", token);
    body.set("intent", "remove");
    body.set("file", file);
    void fetch("/admin/media", { method: "POST", body }).catch(() => undefined);
  }
}

type ProductRow = CommerceSnapshot["products"][number];

// What the modal starts from when editing a saved product: its details, and one card per color
// with that color's photos, sizes and availability. Older products without color details get
// their single photo on every color, ready to be replaced.
function fromProduct(product: ProductRow) {
  const sizes = sortSizes([...new Set(product.variants.map((v) => v.size))]);
  const names = product.colorDetails.length ? product.colorDetails.map((c) => c.name) : [...new Set(product.variants.map((v) => v.color))];
  const sale = product.discountType === "amount" ? (product.onlinePrice - product.discountValue) / 100
    : product.discountType === "percentage" ? Math.round(product.onlinePrice * (100 - product.discountValue)) / 10000 : null;
  const colors: ColorCard[] = names.map((name, index) => {
    const details = product.colorDetails.find((c) => c.name === name);
    const own = product.variants.filter((v) => v.color === name).map((v) => v.size);
    const images = (Array.isArray(details?.images) ? details.images : []) as { url?: string; file?: string }[];
    const saved = details ? images.filter((image) => typeof image.url === "string") : product.imageUrl ? [{ url: product.imageUrl }] : [];
    const photos: Photo[] = saved.map((image) => ({ id: uid(), preview: image.url!, url: image.url, file: (image as { file?: string }).file, status: "done" as const, progress: 100 }));
    return {
      key: uid(), name, nameAr: details?.nameAr || "",
      hex: details?.hex || STARTER_SWATCHES[index % STARTER_SWATCHES.length],
      photos, available: details?.available ?? true,
      sizes: own.length < sizes.length ? sizes.filter((s) => own.includes(s)) : null,
    };
  });
  return {
    mode: (product.colorDetails.length ? product.colorMode : names.length === 1 ? "single" : "multiple") as ColorMode,
    basics: {
      name: product.name, nameAr: product.nameAr, description: product.description, descriptionAr: product.descriptionAr,
      shopId: product.shopId || "", categoryId: product.categoryId || "", brand: product.brand,
      price: product.onlinePrice / 100, salePrice: sale, cost: product.cost / 100, sizes, gender: product.gender as "Boys" | "Girls" | "Unisex",
    },
    colors: colors.length ? colors : [newColor(0)],
  };
}

// Add Product: a guided, phone-friendly way to add one product in one color or several, each
// color with its own photos and availability. Price and details are entered once and shared.
// With `product`, the same steps edit that saved product instead.
export function AddProductModal({ data, product, onClose, onCreated }: { data: CommerceSnapshot; product?: ProductRow; onClose: () => void; onCreated: (id: string) => void }) {
  const token = useContext(TokenContext);
  const cmd = useCommand();
  const [start] = useState(() => (product ? fromProduct(product) : null));
  const editing = Boolean(product);
  const [step, setStep] = useState(editing ? 1 : 0);
  const [mode, setMode] = useState<ColorMode | null>(start?.mode ?? null);
  const [basics, setBasics] = useState<ProductBasics & { gender: "Boys" | "Girls" | "Unisex" }>(start?.basics ?? {
    name: "", nameAr: "", description: "", descriptionAr: "",
    shopId: data.shops[0]?.id || "", categoryId: "", brand: "Boys & Girlz",
    price: 0, salePrice: null, cost: null, sizes: [], gender: "Unisex",
  });
  const [colors, setColors] = useState<ColorCard[]>(start?.colors ?? [newColor(0)]);
  const [issues, setIssues] = useState<ColorDraftIssue[]>([]);
  const [announce, setAnnounce] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const saved = useRef(false);
  const live = useRef(colors);
  live.current = colors;
  const saving = cmd.busy;

  // Focus the step heading when the step changes, so keyboard and screen-reader users follow.
  useEffect(() => { headingRef.current?.focus(); }, [step]);
  // After a successful save, hand the new product's id back.
  useEffect(() => {
    if (cmd.data?.success && cmd.data.result?.id && !saved.current) {
      saved.current = true;
      onCreated(cmd.data.result.id);
    }
  }, [cmd.data, onCreated]);
  // Leaving without saving removes this session's uploads and frees their previews.
  useEffect(() => () => {
    for (const color of live.current) for (const photo of color.photos) if (photo.preview.startsWith("blob:")) URL.revokeObjectURL(photo.preview);
    if (!saved.current) discardPhotos(live.current.flatMap((c) => c.photos.map((p) => p.file || "")).filter(Boolean), token);
  }, [token]);

  const dirty = editing || Boolean(mode || basics.name || colors.some((c) => c.name || c.photos.length));
  const close = () => {
    if (saving) return;
    if (dirty && !saved.current && !window.confirm(editing ? "Close without saving your changes?" : "Discard this product? Nothing has been saved yet.")) return;
    onClose();
  };
  const updateColor = (key: string, change: Partial<ColorCard> | ((c: ColorCard) => Partial<ColorCard>)) =>
    setColors((all) => all.map((c) => (c.key === key ? { ...c, ...(typeof change === "function" ? change(c) : change) } : c)));
  const updatePhoto = (key: string, id: string, change: Partial<Photo>) =>
    updateColor(key, (c) => ({ photos: c.photos.map((p) => (p.id === id ? { ...p, ...change } : p)) }));

  const addPhotos = (color: ColorCard, files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_IMAGES_PER_COLOR - color.photos.length;
    const picked = Array.from(files).slice(0, Math.max(0, room));
    const rejected: string[] = [];
    if (files.length > room) rejected.push(`Only ${MAX_IMAGES_PER_COLOR} photos per color.`);
    for (const file of picked) {
      const problem = imageFileIssue(file);
      if (problem) { rejected.push(problem); continue; }
      const photo: Photo = { id: uid(), preview: URL.createObjectURL(file), status: "uploading", progress: 0 };
      updateColor(color.key, (c) => ({ photos: [...c.photos, photo] }));
      setAnnounce(`Uploading ${file.name}`);
      sendPhoto(file, token, (progress) => updatePhoto(color.key, photo.id, { progress }))
        .then(({ url, file: stored }) => {
          updatePhoto(color.key, photo.id, { url, file: stored, status: "done", progress: 100 });
          setAnnounce(`${file.name} uploaded`);
        })
        .catch((error: Error) => {
          updatePhoto(color.key, photo.id, { status: "error", error: error.message });
          setAnnounce(`${file.name} failed: ${error.message}`);
        });
    }
    if (rejected.length) setAnnounce(rejected.join(" "));
  };
  const removePhoto = (color: ColorCard, photo: Photo) => {
    if (photo.preview.startsWith("blob:")) URL.revokeObjectURL(photo.preview);
    if (photo.file) discardPhotos([photo.file], token);
    updateColor(color.key, (c) => ({ photos: c.photos.filter((p) => p.id !== photo.id) }));
  };
  const movePhoto = (color: ColorCard, from: number, to: number) =>
    updateColor(color.key, (c) => {
      const photos = [...c.photos];
      const [moved] = photos.splice(from, 1);
      photos.splice(to, 0, moved);
      return { photos };
    });
  const removeColor = (color: ColorCard) => {
    discardPhotos(color.photos.map((p) => p.file || "").filter(Boolean), token);
    setColors((all) => all.filter((c) => c.key !== color.key));
  };

  // The product's sizes in shop order; each color comes in all of them unless narrowed.
  const productSizes = SIZES.filter((s) => basics.sizes.includes(s));
  const sizesOf = (c: ColorCard) => (c.sizes ? productSizes.filter((s) => c.sizes!.includes(s)) : productSizes);
  // What the server receives: shared details once, then each color with its own photos.
  const colorDetails = colors.map((c) => ({
    name: c.name.trim(),
    nameAr: c.nameAr.trim(),
    hex: normalizeHex(c.hex),
    images: c.photos.filter((p) => p.status === "done" && p.url).map((p) => ({ url: p.url!, file: p.file })),
    available: c.available,
    sizes: sizesOf(c),
  }));
  const uploading = colors.some((c) => c.photos.some((p) => p.status === "uploading"));
  const failedUploads = colors.some((c) => c.photos.some((p) => p.status === "error"));
  const checkStep = (target: number): ColorDraftIssue[] => {
    if (target >= 1 && !mode) return [{ field: "mode", message: "Choose One Color or Multiple Colors." }];
    if (target >= 2) { const found = validateBasics(basics); if (found.length) return found; }
    if (target >= 3) {
      if (uploading) return [{ field: "colors", message: "Wait for the photos to finish uploading." }];
      if (failedUploads) return [{ field: "colors", message: "Remove or re-add the photos that failed to upload." }];
      return validateColors(mode!, colorDetails, productSizes);
    }
    return [];
  };
  const goTo = (target: number) => {
    const found = target > step ? checkStep(target) : [];
    setIssues(found);
    if (found.length) { setAnnounce(found[0].message); return; }
    setStep(target);
  };
  const chooseMode = (next: ColorMode) => {
    setMode(next);
    if (next === "single" && colors.length > 1) {
      if (!window.confirm("Keep only the first color? The other colors and their photos will be removed.")) return setMode("multiple");
      colors.slice(1).forEach(removeColor);
    }
  };
  const create = () => {
    const found = checkStep(3);
    setIssues(found);
    if (found.length || saving) return setAnnounce(found[0]?.message || "");
    const category = data.categories.find((c) => c.id === basics.categoryId);
    const priceCents = Math.round(basics.price * 100);
    // Editing keeps a percentage discount as it was when the price and sale price weren't touched.
    const keepDiscount = Boolean(product && product.discountType === "percentage" && start && basics.price === start.basics.price && basics.salePrice === start.basics.salePrice);
    setAnnounce("Saving the product…");
    cmd.run("product", {
      ...(product ? { id: product.id } : {}),
      name: basics.name.trim(),
      slug: product ? product.slug : productSlug(basics.name, Date.now().toString(36)),
      description: basics.description.trim(),
      nameAr: basics.nameAr.trim(),
      descriptionAr: basics.descriptionAr.trim(),
      category: category?.name || "Unlisted",
      categoryId: basics.categoryId,
      shopId: basics.shopId,
      visibility: product?.visibility === "pos_only" ? "pos_only" : "website_and_pos",
      discountType: keepDiscount ? "percentage" : basics.salePrice !== null ? "amount" : null,
      discountValue: keepDiscount ? product!.discountValue : basics.salePrice !== null ? priceCents - Math.round(basics.salePrice * 100) : 0,
      gender: basics.gender,
      brand: basics.brand.trim(),
      season: product?.season || "All season",
      imageUrl: product?.imageUrl || "",
      imageIndex: product?.imageIndex || 0,
      // The in-store price follows the online price, unless the product had its own.
      price: product && product.price !== product.onlinePrice ? product.price : priceCents,
      onlinePrice: priceCents,
      cost: Math.round((basics.cost ?? 0) * 100),
      threshold: product?.threshold ?? 5,
      featured: product?.featured ?? false,
      sizes: productSizes,
      colors: colorDetails.map((c) => c.name),
      colorMode: mode,
      colorDetails,
    });
  };
  const issue = (field: string) => issues.find((i) => i.field === field || i.field.startsWith(`${field}.`))?.message;
  const categories = data.categories.filter((c) => c.shopId === basics.shopId);

  return (
    <Modal title={editing ? `Edit ${product!.name}` : "Add product"} onClose={close} className="co-modal-wizard">
      <ol className="apm-steps" aria-label="Progress">
        {STEPS.map((label, i) => <li key={label} className={i === step ? "is-current" : i < step ? "is-done" : ""} aria-current={i === step ? "step" : undefined}>
          <span aria-hidden="true">{i < step ? <Check size={13} /> : i + 1}</span>{label}
        </li>)}
      </ol>
      <p className="sr-only" role="status" aria-live="polite">{announce}</p>
      {issues.length > 0 && <div className="co-alert error" role="alert">{issues[0].message}{issues.length > 1 ? ` (+${issues.length - 1} more)` : ""}</div>}
      {cmd.data?.error && <div className="co-alert error" role="alert">{cmd.data.error}</div>}

      {step === 0 && <section className="apm-step">
        <h3 ref={headingRef} tabIndex={-1}>How many colors does this item come in?</h3>
        <div className="apm-choice" role="radiogroup" aria-label="Color type">
          <ChoiceCard selected={mode === "single"} onSelect={() => chooseMode("single")} icon={<Palette size={26} />} title="One color" body="The item comes in a single color. You add that one color and its photos." />
          <ChoiceCard selected={mode === "multiple"} onSelect={() => chooseMode("multiple")} icon={<Layers size={26} />} title="Multiple colors" body="The same item in several colors, at the same price. Each color gets its own photos and stock status." />
        </div>
      </section>}

      {step === 1 && <section className="apm-step">
        <h3 ref={headingRef} tabIndex={-1}>Shared details</h3>
        <p className="apm-note">These are the same for every color. The price is entered once.</p>
        <div className="co-form co-two">
          <Text label="Product name (English)" value={basics.name} onChange={(name) => setBasics({ ...basics, name })} error={issue("name")} required maxLength={150} placeholder="Baby girl dress" />
          <Text label="Product name (Arabic)" value={basics.nameAr} onChange={(nameAr) => setBasics({ ...basics, nameAr })} error={issue("nameAr")} maxLength={150} dir="rtl" placeholder="فستان للبنات" />
          <Area label="Description (English)" value={basics.description} onChange={(description) => setBasics({ ...basics, description })} />
          <Area label="Description (Arabic)" value={basics.descriptionAr} onChange={(descriptionAr) => setBasics({ ...basics, descriptionAr })} dir="rtl" />
          <label className="co-field"><span>Shop</span>
            <select value={basics.shopId} onChange={(e) => setBasics({ ...basics, shopId: e.target.value, categoryId: "" })} aria-invalid={Boolean(issue("shopId"))}>
              {data.shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>{issue("shopId") && <small className="apm-error">{issue("shopId")}</small>}</label>
          <label className="co-field"><span>Category</span>
            <select value={basics.categoryId} onChange={(e) => setBasics({ ...basics, categoryId: e.target.value })} aria-invalid={Boolean(issue("categoryId"))} required>
              <option value="">Choose a category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>{issue("categoryId") && <small className="apm-error">{issue("categoryId")}</small>}
            {!categories.length && <small>No categories in this shop yet. Add one from the full product editor first.</small>}</label>
          <label className="co-field"><span>Shop for</span>
            <select value={basics.gender} onChange={(e) => setBasics({ ...basics, gender: e.target.value as "Boys" | "Girls" | "Unisex" })}>
              <option value="Boys">Boys</option><option value="Girls">Girls</option><option value="Unisex">Unisex</option>
            </select></label>
          <Text label="Brand" value={basics.brand} onChange={(brand) => setBasics({ ...basics, brand })} error={issue("brand")} required maxLength={150} />
          <Money label="Price $" value={basics.price || ""} onChange={(v) => setBasics({ ...basics, price: v ?? 0 })} error={issue("price")} required />
          <Money label="Sale price $ (optional)" value={basics.salePrice ?? ""} onChange={(v) => setBasics({ ...basics, salePrice: v })} error={issue("salePrice")} hint="Leave empty if the item isn't on sale." />
          <Money label="Cost per item $ (what you pay)" value={basics.cost ?? ""} onChange={(v) => setBasics({ ...basics, cost: v })} error={issue("cost")} required hint={margin(basics) || "Used for cost of goods sold, profit and stock value. Not shown to customers."} />
        </div>
        <fieldset className="apm-sizes" aria-invalid={Boolean(issue("sizes"))}>
          <legend>Sizes <small>Tap every size you sell</small></legend>
          <div>{SIZES.map((size) => {
            const on = basics.sizes.includes(size);
            return <button key={size} type="button" aria-pressed={on} className={on ? "is-on" : ""} onClick={() => setBasics({ ...basics, sizes: on ? basics.sizes.filter((s) => s !== size) : [...basics.sizes, size] })}>{on && <Check size={13} aria-hidden="true" />}{size}</button>;
          })}</div>
          {issue("sizes") && <small className="apm-error">{issue("sizes")}</small>}
        </fieldset>
      </section>}

      {step === 2 && <section className="apm-step">
        <h3 ref={headingRef} tabIndex={-1}>{mode === "single" ? "The color and its photos" : "Colors and their photos"}</h3>
        <p className="apm-note">Photos added to a color belong to that color only. The first photo is the cover.</p>
        <div className="apm-colors">
          {colors.map((color, index) => <ColorEditor key={color.key} color={color} index={index} single={mode === "single"} canRemove={mode === "multiple" && colors.length > 1}
            productSizes={productSizes} error={issue(`colors.${index}`)} onChange={(change) => updateColor(color.key, change)} onPhotos={(files) => addPhotos(color, files)}
            onRemovePhoto={(photo) => removePhoto(color, photo)} onMovePhoto={(from, to) => movePhoto(color, from, to)} onRemove={() => removeColor(color)} />)}
        </div>
        {mode === "multiple" && colors.length < MAX_COLORS && <button type="button" className="co-button apm-add-color" onClick={() => setColors((all) => [...all, newColor(all.length)])}>
          <Plus size={17} /> Add another color
        </button>}
        {issue("colors") && !issues[0].field.startsWith("colors.") && <p className="apm-error">{issue("colors")}</p>}
      </section>}

      {step === 3 && <section className="apm-step">
        <h3 ref={headingRef} tabIndex={-1}>{editing ? "Check before saving" : "Check before creating"}</h3>
        <dl className="apm-review">
          <div><dt>Name</dt><dd>{basics.name}{basics.nameAr && <span dir="rtl"> · {basics.nameAr}</span>}</dd></div>
          <div><dt>Category</dt><dd>{data.categories.find((c) => c.id === basics.categoryId)?.name} · {basics.gender}</dd></div>
          <div><dt>Price (all colors)</dt><dd>${basics.price.toFixed(2)}{basics.salePrice !== null && <> · on sale for <strong>${basics.salePrice.toFixed(2)}</strong></>}</dd></div>
          <div><dt>Cost per item</dt><dd>${(basics.cost ?? 0).toFixed(2)}{margin(basics) && <> · {margin(basics)}</>}</dd></div>
          <div><dt>Sizes</dt><dd>{SIZES.filter((s) => basics.sizes.includes(s)).join(", ")}</dd></div>
          {basics.description && <div className="apm-wide"><dt>Description</dt><dd>{basics.description}</dd></div>}
          <div><dt>Colors</dt><dd>{colors.length} ({mode === "single" ? "one color" : "multiple colors"})</dd></div>
        </dl>
        <ul className="apm-review-colors">
          {colors.map((c) => <li key={c.key}>
            <span className="apm-swatch" style={{ background: normalizeHex(c.hex) }} aria-hidden="true" />
            <strong>{c.name}</strong>{c.nameAr && <span dir="rtl"> · {c.nameAr}</span>}
            <span className={`apm-status ${c.available ? "is-in" : "is-out"}`}>{c.available ? "Available" : "Out of stock"}</span>
            <span className="apm-review-sizes">{sizesOf(c).length === productSizes.length ? "All sizes" : sizesOf(c).join(", ")}</span>
            <div className="apm-review-photos">{c.photos.map((p, i) => <img key={p.id} src={p.url || p.preview} alt={`${c.name} photo ${i + 1}${i === 0 ? " (cover)" : ""}`} />)}</div>
          </li>)}
        </ul>
        {cmd.data?.success && <div className="co-alert success" role="status">{editing ? "Changes saved." : "Product created."}</div>}
      </section>}

      <div className="apm-actions">
        <button type="button" className="co-button" onClick={close} disabled={saving}>Cancel</button>
        <span className="apm-spacer" />
        {step > 0 && <button type="button" className="co-button" onClick={() => goTo(step - 1)} disabled={saving}><ArrowLeft size={16} /> Back</button>}
        {step === 3 && <button type="button" className="co-button" onClick={() => goTo(1)} disabled={saving}>Edit details</button>}
        {step < 3
          ? <button type="button" className="co-button primary" onClick={() => goTo(step + 1)} disabled={step === 2 && uploading}>{step === 2 && uploading ? <><LoaderCircle size={16} className="apm-spin" /> Uploading…</> : <>Next <ArrowRight size={16} /></>}</button>
          : <button type="button" className="co-button primary" onClick={create} disabled={saving || Boolean(cmd.data?.success)}>{saving ? <><LoaderCircle size={16} className="apm-spin" /> Creating…</> : <><Check size={16} /> {editing ? "Save changes" : "Create product"}</>}</button>}
      </div>
    </Modal>
  );
}

// Profit on one item at the price customers pay, e.g. "Profit $14.00 per item (47%)".
function margin(basics: ProductBasics): string {
  if (basics.cost === null || !(basics.price > 0)) return "";
  const selling = basics.salePrice ?? basics.price;
  const profit = selling - basics.cost;
  return `Profit ${profit < 0 ? "−" : ""}$${Math.abs(profit).toFixed(2)} per item (${Math.round((profit / selling) * 100)}%)`;
}

function ChoiceCard({ selected, onSelect, icon, title, body }: { selected: boolean; onSelect: () => void; icon: ReactNode; title: string; body: string }) {
  return <button type="button" role="radio" aria-checked={selected} className={`apm-choice-card ${selected ? "is-selected" : ""}`} onClick={onSelect}>
    <span className="apm-choice-icon" aria-hidden="true">{icon}</span>
    <strong>{title}</strong><span>{body}</span>
    {selected && <Check size={18} className="apm-choice-tick" aria-hidden="true" />}
  </button>;
}

function ColorEditor({ color, index, single, canRemove, productSizes, error, onChange, onPhotos, onRemovePhoto, onMovePhoto, onRemove }: {
  color: ColorCard; index: number; single: boolean; canRemove: boolean; productSizes: string[]; error?: string;
  onChange: (change: Partial<ColorCard>) => void; onPhotos: (files: FileList | null) => void;
  onRemovePhoto: (photo: Photo) => void; onMovePhoto: (from: number, to: number) => void; onRemove: () => void;
}) {
  const label = color.name || (single ? "This color" : `Color ${index + 1}`);
  const hex = normalizeHex(color.hex);
  return <article className="apm-color" style={{ ["--swatch" as string]: /^#[0-9a-f]{6}$/.test(hex) ? hex : "#ddd" }} aria-label={label}>
    <header>
      <span className="apm-swatch" aria-hidden="true" />
      <strong>{label}</strong>
      {canRemove && <button type="button" className="co-icon" onClick={onRemove} aria-label={`Remove ${label}`}><Trash2 size={17} /></button>}
    </header>
    <div className="co-form co-two">
      <Text label="Color name (English)" value={color.name} onChange={(name) => onChange({ name })} required maxLength={40} placeholder="Pink" />
      <Text label="Color name (Arabic)" value={color.nameAr} onChange={(nameAr) => onChange({ nameAr })} maxLength={40} dir="rtl" placeholder="زهري" />
      <div className="co-field apm-hex"><span id={`${color.key}-hex`}>Swatch</span>
        <div>
          <input type="color" aria-labelledby={`${color.key}-hex`} value={/^#[0-9a-f]{6}$/.test(hex) ? hex : "#dddddd"} onChange={(e) => onChange({ hex: e.target.value })} />
          <input type="text" aria-label={`${label} hex code`} value={color.hex} onChange={(e) => onChange({ hex: e.target.value })} maxLength={7} spellCheck={false} />
        </div>
      </div>
      <div className="co-field"><span id={`${color.key}-stock`}>Online availability</span>
        <div className="apm-toggle" role="radiogroup" aria-labelledby={`${color.key}-stock`}>
          <button type="button" role="radio" aria-checked={color.available} className={color.available ? "is-on" : ""} onClick={() => onChange({ available: true })}>Available</button>
          <button type="button" role="radio" aria-checked={!color.available} className={!color.available ? "is-on is-out" : ""} onClick={() => onChange({ available: false })}>Out of stock</button>
        </div>
      </div>
    </div>
    {productSizes.length > 1 && <fieldset className="apm-sizes apm-color-sizes">
      <legend>Sizes in {color.name || "this color"} <small>{color.sizes ? `${productSizes.filter((s) => color.sizes!.includes(s)).length} of ${productSizes.length}` : "All sizes"}</small></legend>
      <div>{productSizes.map((size) => {
        const chosen = color.sizes ? color.sizes.includes(size) : true;
        const toggle = () => {
          const current = color.sizes ?? productSizes;
          const next = chosen ? current.filter((s) => s !== size) : [...current, size];
          onChange({ sizes: next.length === productSizes.length && productSizes.every((s) => next.includes(s)) ? null : next });
        };
        return <button key={size} type="button" aria-pressed={chosen} className={chosen ? "is-on" : ""} onClick={toggle}>{chosen && <Check size={13} aria-hidden="true" />}{size}</button>;
      })}</div>
      {!single && <small className="apm-hint">Untick the sizes this color doesn't come in.</small>}
    </fieldset>}
    <div className="apm-photos">
      {color.photos.map((photo, i) => <figure key={photo.id} className={`apm-photo ${photo.status}`}>
        <img src={photo.url || photo.preview} alt={`${label} photo ${i + 1}`} />
        {i === 0 && <span className="apm-cover"><Star size={11} aria-hidden="true" /> Cover</span>}
        {photo.status === "uploading" && <span className="apm-progress" role="progressbar" aria-label={`Uploading ${label} photo ${i + 1}`} aria-valuenow={photo.progress} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${photo.progress}%` }} /></span>}
        {photo.status === "error" && <figcaption className="apm-error">{photo.error}</figcaption>}
        <div className="apm-photo-tools">
          {i > 0 && photo.status === "done" && <button type="button" onClick={() => onMovePhoto(i, 0)} aria-label={`Make photo ${i + 1} the cover`}><Star size={14} /></button>}
          {i > 0 && <button type="button" onClick={() => onMovePhoto(i, i - 1)} aria-label={`Move photo ${i + 1} earlier`}><ChevronLeft size={14} /></button>}
          {i < color.photos.length - 1 && <button type="button" onClick={() => onMovePhoto(i, i + 1)} aria-label={`Move photo ${i + 1} later`}><ChevronRight size={14} /></button>}
          <button type="button" onClick={() => onRemovePhoto(photo)} aria-label={`Remove photo ${i + 1}`}><Trash2 size={14} /></button>
        </div>
      </figure>)}
      {color.photos.length < MAX_IMAGES_PER_COLOR && <label className="apm-drop">
        <ImagePlus size={22} aria-hidden="true" />
        <span>Add photos of {color.name || "this color"}<small>JPG, PNG, WebP or GIF · up to 15 MB each, shrunk automatically</small></span>
        <input type="file" accept={IMAGE_TYPES.join(",")} multiple onChange={(e) => { onPhotos(e.target.files); e.target.value = ""; }} />
      </label>}
    </div>
    {error && <p className="apm-error">{error}</p>}
  </article>;
}

function Text({ label, value, onChange, error, required, maxLength, placeholder, dir }: { label: string; value: string; onChange: (v: string) => void; error?: string; required?: boolean; maxLength?: number; placeholder?: string; dir?: "rtl" }) {
  return <label className="co-field"><span>{label}{required && <b aria-hidden="true"> *</b>}</span>
    <input value={value} onChange={(e) => onChange(e.target.value)} required={required} maxLength={maxLength} placeholder={placeholder} dir={dir} aria-invalid={Boolean(error)} />
    {error && <small className="apm-error">{error}</small>}</label>;
}
function Area({ label, value, onChange, dir }: { label: string; value: string; onChange: (v: string) => void; dir?: "rtl" }) {
  return <label className="co-field co-wide"><span>{label}</span>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} maxLength={500} dir={dir} /><small>{value.length}/500</small></label>;
}
function Money({ label, value, onChange, error, required, hint }: { label: string; value: number | string; onChange: (v: number | null) => void; error?: string; required?: boolean; hint?: string }) {
  return <label className="co-field"><span>{label}{required && <b aria-hidden="true"> *</b>}</span>
    <input type="number" inputMode="decimal" min={0} step="0.01" value={value} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} required={required} aria-invalid={Boolean(error)} />
    {error ? <small className="apm-error">{error}</small> : hint && <small>{hint}</small>}</label>;
}
