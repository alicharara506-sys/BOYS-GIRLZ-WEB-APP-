import { useEffect, useRef, type PointerEvent } from "react";
import { Link } from "./LocalizedLink";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "../hooks/useExperience";
import { useLocale } from "../i18n/Locale";

gsap.registerPlugin(ScrollTrigger);

const corners = [
  { key: "boys", eyebrow: "The boys' corner", lines: ["Ready, set,", "play."], body: "Everyday outfits and layers for little adventures.", path: "/category/boys", action: "Shop Boys", image: "/assets/corners/boys-doodle.webp" },
  { key: "girls", eyebrow: "The girls' corner", lines: ["Made to", "shine."], body: "Sweet details and comfortable pieces for every day.", path: "/category/girls", action: "Shop Girls", image: "/assets/corners/girls-doodle.webp" },
  { key: "baby", eyebrow: "The baby nursery", lines: ["Hello, little", "one."], body: "Soft essentials for newborns and babies.", path: "/category/unisex", action: "Shop Unisex", image: "/assets/corners/nursery-doodle.webp" },
  { key: "toys", eyebrow: "The toy shelf", lines: ["Small toys,", "big smiles."], body: "Playtime companions and thoughtful gifts.", path: "/category/toys", action: "Shop Toys", image: "/assets/corners/toys-doodle.webp" },
];

const spotlight = (event: PointerEvent<HTMLAnchorElement>) => {
  const tile = event.currentTarget;
  const box = tile.getBoundingClientRect();
  tile.style.setProperty("--mx", `${event.clientX - box.left}px`);
  tile.style.setProperty("--my", `${event.clientY - box.top}px`);
};

export default function CornerTiles() {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduceMotion) return;
    const ctx = gsap.context(() => {
      gsap.from(".corners-heading > *", {
        y: 30, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.1,
        scrollTrigger: { trigger: section, start: "top 85%", once: true },
      });
      gsap.from(".corners-squiggle path", {
        strokeDashoffset: 260, duration: 1.2, ease: "power2.inOut", delay: 0.3,
        scrollTrigger: { trigger: section, start: "top 85%", once: true },
      });
      gsap.from(".corner-tile", {
        y: 70, rotate: (i) => (i % 2 ? 3 : -3), opacity: 0, duration: 0.9, ease: "back.out(1.4)", stagger: 0.09,
        scrollTrigger: { trigger: ".corners-grid", start: "top 85%", once: true },
      });
    }, section);
    return () => ctx.revert();
  }, [reduceMotion]);

  return <section ref={sectionRef} className="corners page-width" aria-labelledby="corners-heading">
    <div className="corners-heading">
      <div className="section-eyebrow">
        <span aria-hidden="true" />
        <span className="section-eyebrow-text">{t("Shop for")}</span>
        <span aria-hidden="true" />
      </div>
      <h2 id="corners-heading">{t("Explore Boys & Girlz")}</h2>
      <svg className="corners-squiggle" viewBox="0 0 220 16" aria-hidden="true">
        <defs><linearGradient id="corners-squiggle-ink" x1="0" x2="1"><stop offset="0" stopColor="#fc538e" /><stop offset="1" stopColor="#00b3fc" /></linearGradient></defs>
        <path d="M3 10c18-8 36-8 54 0s36 8 54 0 36-8 54 0 36 8 52 0" />
      </svg>
    </div>
    <div className="corners-grid">
      {corners.map((corner) => <Link className={`corner-tile corner-tile-${corner.key}`} to={corner.path} key={corner.key} onPointerMove={spotlight}>
        <span className="corner-media" aria-hidden="true">
          <img src={corner.image} alt="" width={1024} height={1536} loading="lazy" decoding="async" />
        </span>
        <span className="corner-copy">
          <span className="corner-eyebrow">{t(corner.eyebrow)}</span>
          <h3>{t(corner.lines[0])} <span>{t(corner.lines[1])}</span></h3>
          <span className="corner-body">{t(corner.body)}</span>
          <span className="corner-action">{t(corner.action)} <ArrowRight size={16} aria-hidden="true" /></span>
        </span>
      </Link>)}
    </div>
  </section>;
}
