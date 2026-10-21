import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight, Heart, Pause, Play, Sparkles, Star } from "lucide-react";
import CategoryScene from "./CategoryScene";
import { localizedCount, useLocale } from "../i18n/Locale";

type Collection = "Boys" | "Girls" | "Unisex";

const collections: Record<Collection, { label: string; title: string; accent: string; description: string; note: string }> = {
  Boys: {
    label: "The boys' edit",
    title: "Little outfits.",
    accent: "Big adventures.",
    description: "From first steps to everyday discoveries. Easy little outfits for wherever their curiosity takes them.",
    note: "Ready for a little adventure",
  },
  Girls: {
    label: "The girls' edit",
    title: "A little charm.",
    accent: "So much possibility.",
    description: "For curious minds and days full of wonder. Lovely little pieces, ready for her own kind of adventure.",
    note: "A little joy in every detail",
  },
  Unisex: {
    label: "The everyone edit",
    title: "Little favorites.",
    accent: "For every little one.",
    description: "Thoughtful everyday pieces for boys and girls. Easy to wear, easy to love, and full of personality.",
    note: "Better together, always",
  },
};

export default function CategoryHero({ category, count }: { category: Collection; count: number }) {
  const { language, t } = useLocale();
  const [paused, setPaused] = useState(false);
  const copy = collections[category];
  return (
    <section className={`collection-hero collection-hero-${category.toLowerCase()}`} data-motion={paused ? "paused" : "playing"} aria-labelledby="collection-title">
      <div className="collection-body">
        <div className="collection-copy">
          <span className="collection-eyebrow"><span aria-hidden="true" />{t(copy.label)}</span>
          <h1 id="collection-title">{t(copy.title)}<span>{t(copy.accent)}</span></h1>
          <p className="collection-description">{t(copy.description)}</p>
          <a className="collection-cta" href="#category-products">{t("Explore the collection")}<ArrowDown size={17} aria-hidden="true" /></a>
          <span className="collection-caption"><Heart size={14} aria-hidden="true" />{t("Little details. Lots of love.")}</span>
        </div>
        <div className="collection-art">
          <span className="collection-art-caption" aria-hidden="true">Boys & Girlz</span>
          <span className="collection-orbit" aria-hidden="true" />
          <svg className="collection-trail" viewBox="0 0 460 320" fill="none" aria-hidden="true"><path d="M24 226C82 296 161 257 128 209C99 166 35 198 81 239C152 302 385 268 430 97" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeDasharray="4 9" /><path d="m413 103 20-16 3 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span className="collection-doodle collection-doodle-star" aria-hidden="true"><Star /></span>
          <span className="collection-doodle collection-doodle-spark" aria-hidden="true"><Sparkles /></span>
          <span className="collection-doodle collection-doodle-heart" aria-hidden="true"><Heart /></span>
          <CategoryScene category={category} />
          <span className="collection-art-note"><Sparkles size={15} aria-hidden="true" />{t(copy.note)}</span>
        </div>
      </div>
      <div className="collection-footer">
        <nav className="collection-tabs" aria-label={t("Explore children's collections")}>
          {(["Boys", "Girls", "Unisex"] as const).map((item) => (
            <Link key={item} to={`/category/${item.toLowerCase()}`} aria-current={item === category ? "page" : undefined}>
              {t(item === "Boys" ? "Little Boys" : item === "Girls" ? "Little Girls" : "For everyone")}<ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          ))}
        </nav>
        <span className="collection-count">{localizedCount(count, "product", language)}</span>
        <button className="collection-motion-control" type="button" aria-pressed={paused} aria-label={t(paused ? "Resume banner animations" : "Pause banner animations")} onClick={() => setPaused(!paused)}>
          {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}<span>{t(paused ? "Play motion" : "Pause motion")}</span>
        </button>
      </div>
    </section>
  );
}
