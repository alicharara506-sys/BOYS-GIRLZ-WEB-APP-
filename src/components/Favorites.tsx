import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { products } from "../data/products";
import ProductCard from "./ProductCard";
import { useReducedMotion } from "../hooks/useExperience";
import { useLocale } from "../i18n/Locale";

gsap.registerPlugin(ScrollTrigger);

const featured = products.slice(0, 4);
const filters = ["All", "Boys", "Girls", "Baby"] as const;
// Boys take the blue, girls the pink, and baby (unisex) pieces both.
const tones: Record<string, string> = { All: "all", Boys: "boys", Girls: "girls", Baby: "unisex" };
type Filter = (typeof filters)[number];

// The homepage's featured products. The filters are one pill bar with a highlight that slides
// to the chosen one; switching lets the cards bow out and the new set rise in, one after another.
export default function Favorites() {
  const { t, language } = useLocale();
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("All");
  const sectionRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const switching = useRef(false);
  const visibleProducts = featured.filter((product) =>
    filter === "All" ||
    (filter === "Baby" ? product.category === "Unisex" : product.category === filter),
  );

  // Moves the highlight under the chosen filter (and again when the bar resizes or the language changes).
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const place = () => {
      const active = bar.querySelector<HTMLElement>("button.active");
      if (!active) return;
      bar.style.setProperty("--pill-x", `${active.offsetLeft}px`);
      bar.style.setProperty("--pill-w", `${active.offsetWidth}px`);
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [filter, language]);

  // The cards rise in one after another when the section scrolls into view.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || reduceMotion) return;
    const ctx = gsap.context(() => {
      gsap.from(".favorites-heading > *", {
        y: 24, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.08,
        scrollTrigger: { trigger: section, start: "top 85%", once: true },
      });
      gsap.from(".favorites-grid > .pc", {
        y: 60, opacity: 0, scale: 0.96, duration: 0.9, ease: "back.out(1.3)", stagger: 0.08,
        scrollTrigger: { trigger: ".favorites-grid", start: "top 88%", once: true },
      });
    }, section);
    return () => ctx.revert();
  }, [reduceMotion]);

  // After a switch, the new set of cards rises in.
  useLayoutEffect(() => {
    if (!switching.current || !gridRef.current) return;
    switching.current = false;
    gsap.fromTo(gridRef.current.children,
      { y: 28, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.4)", stagger: 0.07, clearProps: "transform,opacity" });
  }, [filter]);

  const choose = (next: Filter) => {
    if (next === filter) return;
    const cards = gridRef.current?.children;
    if (reduceMotion || !cards?.length) return setFilter(next);
    gsap.to(cards, {
      y: -12, opacity: 0, scale: 0.97, duration: 0.2, ease: "power2.in", stagger: 0.03,
      onComplete: () => { switching.current = true; setFilter(next); },
    });
  };

  return <section ref={sectionRef} className="favorites page-width" aria-labelledby="favorites-heading">
    <div className="favorites-heading">
      <div className="section-eyebrow">
        <span aria-hidden="true" />
        <span className="section-eyebrow-text">{t("New In")}</span>
        <span aria-hidden="true" />
      </div>
      <h2 id="favorites-heading">{t("Their next favorites")}</h2>
      <div className={`favorites-filters tone-${tones[filter]}`} ref={barRef} role="group" aria-label={t("Filter featured products")}>
        <span className="favorites-pill tone-pill" aria-hidden="true"><span className="tone-burst" key={filter} /></span>
        {filters.map((item) => (
          <button key={item} type="button" data-tone={tones[item]} className={filter === item ? "active" : ""} aria-pressed={filter === item} onClick={() => choose(item)}>{t(item)}</button>
        ))}
      </div>
    </div>
    <div className="favorites-grid" ref={gridRef}>
      {visibleProducts.map((product) => <ProductCard key={product.id} product={product} showRange />)}
    </div>
    <div className="favorites-more">
      <Link to="/shop?sort=newest" className="favorites-view-all">{t("View all")} <ArrowRight size={16} aria-hidden="true" /></Link>
    </div>
  </section>;
}
