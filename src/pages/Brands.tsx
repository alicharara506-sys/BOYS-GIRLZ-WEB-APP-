import { useRef, type CSSProperties, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { approvedBrands } from "../data/brands";
import { SplitTitle } from "../components/HeroSection";
import { useLocale } from "../i18n/Locale";

// The best-known brands, first and on large cards.
const FEATURED = ["Carter's", "Disney", "Gap"];
// How far the cursor's light reaches across the cards, in pixels.
const REACH = 340;
// Every card takes the shop's pink or blue, alternating, so the page stays on theme.
const tints = ["#fc538e", "#00a8f0"];

// Every brand as a directory, like a partner list: the leading brands on large cards, the rest
// on compact ones. One light follows the cursor across all of them, warming each card's surface
// and lighting its edge in the brand's own colour as the cursor comes near.
export default function Brands() {
  const { t, language } = useLocale();
  const listRef = useRef<HTMLDivElement>(null);
  const sorted = [...approvedBrands].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
  const featured = FEATURED.filter((brand) => sorted.includes(brand as (typeof approvedBrands)[number]));
  const rest = sorted.filter((brand) => !FEATURED.includes(brand));

  const light = (event: PointerEvent<HTMLDivElement>) => {
    listRef.current?.querySelectorAll<HTMLElement>(".brand-card").forEach((card) => {
      const box = card.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      const dx = Math.max(box.left - event.clientX, 0, event.clientX - box.right);
      const dy = Math.max(box.top - event.clientY, 0, event.clientY - box.bottom);
      card.style.setProperty("--mx", `${x}px`);
      card.style.setProperty("--my", `${y}px`);
      card.style.setProperty("--near", Math.max(0, 1 - Math.hypot(dx, dy) / REACH).toFixed(3));
    });
  };
  const dark = () => listRef.current?.querySelectorAll<HTMLElement>(".brand-card").forEach((card) => card.style.setProperty("--near", "0"));

  const card = (brand: string, index: number, large = false) => {
    const tint = tints[index % 2];
    return <li key={brand} style={{ "--i": index } as CSSProperties}>
      <div className={`brand-card ${large ? "brand-card-lg" : ""}`} style={{ "--brand": tint } as CSSProperties}>
        <span className="brand-card-light" aria-hidden="true" />
        <span className="brand-card-edge" aria-hidden="true" />
        <span className="brand-card-head">
          <span className="brand-card-icon" aria-hidden="true">{brand.replace(/[^A-Za-z]/g, "").slice(0, large ? 2 : 1)}</span>
          <span className="brand-card-name">
            {large && <small>{t("Featured")}</small>}
            <strong>{brand}</strong>
          </span>
        </span>
      </div>
    </li>;
  };

  return <div className="brands-v3 page-width">
    <nav className="breadcrumbs brands-v3-crumbs" aria-label="Breadcrumb">
      <Link to="/">{t("Home")}</Link><ChevronRight size={12} aria-hidden="true" />
      <Link to="/shop">{t("Shop")}</Link><ChevronRight size={12} aria-hidden="true" />
      <span>{t("Brands")}</span>
    </nav>
    <header className="brands-v3-head">
      <div className="about-fields" aria-hidden="true">
        <span className="about-field about-field-pink" />
        <span className="about-field about-field-blue" />
      </div>
      <div className="section-eyebrow">
        <span aria-hidden="true" />
        <span className="section-eyebrow-text">{t("Brands")}</span>
        <span aria-hidden="true" />
      </div>
      <h1 className="contact-title"><SplitTitle text={t("The brands we trust.")} byWord={language === "ar"} /></h1>
      <p className="contact-lead">{t("Brands you'll find here")}</p>
    </header>

    <div className="brands-v3-list" ref={listRef} onPointerMove={light} onPointerLeave={dark}>
      <ul className="brands-v3-featured">{featured.map((brand, i) => card(brand, i, true))}</ul>
      <ul className="brands-v3-grid">{rest.map((brand, i) => card(brand, i + featured.length))}</ul>
    </div>
  </div>;
}
