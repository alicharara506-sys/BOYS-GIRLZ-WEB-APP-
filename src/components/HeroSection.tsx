import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import { Link } from "react-router";
import { ArrowRight, Heart, Truck } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "../hooks/useExperience";
import { useLocale } from "../i18n/Locale";

gsap.registerPlugin(ScrollTrigger);

const photos = [
  { pos: "start", src: "/assets/editorial-lilac-baby.jpg" },
  { pos: "end", src: "/assets/editorial-pink-baby.jpg" },
  { pos: "center", src: "/assets/editorial-boy-baby.jpg" },
] as const;

const mix = (from: number[], to: number[], p: number) => `rgb(${from.map((value, i) => Math.round(value + (to[i] - value) * p)).join(",")})`;
const pink = [252, 83, 142];
const blue = [0, 179, 252];

// Latin lines animate letter by letter; Arabic animates word by word so joined letters stay intact.
export function AnimatedLine({ text, start, gradient, byWord }: { text: string; start: number; gradient?: boolean; byWord: boolean }) {
  const words = text.split(" ");
  const total = text.replace(/ /g, "").length;
  let index = 0;
  return <>{words.map((word, w) => {
    const parts = byWord ? [word] : Array.from(word);
    return <span key={w}><span className="bh-word">
      {parts.map((part, p) => {
        const i = index;
        index += part.length;
        // Whole words (Arabic) carry the gradient across their letters; single letters each take one step of it.
        const style = { "--i": start + i, ...(gradient && !byWord ? { color: mix(pink, blue, total > 1 ? i / (total - 1) : 0) } : {}) } as CSSProperties;
        return <span className={`bh-letter ${gradient && byWord ? "bh-letter-grad" : ""}`} style={style} key={p}>{part}</span>;
      })}
    </span>{w < words.length - 1 ? " " : null}</span>;
  })}</>;
}

// A one-sentence title as two springing lines, the second in the pink-to-blue gradient, split at
// the middle word (by words, so it works the same in Arabic).
export function SplitTitle({ text, byWord }: { text: string; byWord: boolean }) {
  const words = text.split(" ");
  // A one-word title is all gradient.
  if (words.length === 1) return <>
    <span className="sr-only">{text}</span>
    <span className="bh-line bh-line-accent" aria-hidden="true"><AnimatedLine text={text} start={0} gradient byWord={byWord} /></span>
  </>;
  const cut = Math.ceil(words.length / 2);
  const first = words.slice(0, cut).join(" ");
  const second = words.slice(cut).join(" ");
  return <>
    <span className="sr-only">{text}</span>
    <span className="bh-line" aria-hidden="true"><AnimatedLine text={first} start={0} byWord={byWord} /></span>
    {second && <span className="bh-line bh-line-accent" aria-hidden="true"><AnimatedLine text={second} start={first.length} gradient byWord={byWord} /></span>}
  </>;
}

export default function HeroSection() {
  const { t, language } = useLocale();
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const lineOne = t("Little clothes,");
  const lineTwo = t("for big smiles.");
  const byWord = language === "ar";

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduceMotion) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: 0.6 } });
      tl.to("[data-scroll=start]", { xPercent: -22, yPercent: -8, rotate: -7 }, 0)
        .to("[data-scroll=end]", { xPercent: 22, yPercent: -4, rotate: 7 }, 0)
        .to("[data-scroll=center]", { yPercent: -16, scale: 1.04 }, 0)
        .to(".bh-mascot-wrap", { yPercent: 18 }, 0)
        .to(".bh-copy", { y: -60, opacity: 0.2 }, 0)
        .to(".bh-aurora", { yPercent: 6 }, 0);
    }, section);
    return () => ctx.revert();
  }, [reduceMotion]);

  const tilt = (event: PointerEvent<HTMLDivElement>) => {
    const deck = deckRef.current;
    if (!deck || reduceMotion || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    deck.style.setProperty("--ry", `${x * 14}deg`);
    deck.style.setProperty("--rx", `${y * -12}deg`);
  };
  const resetTilt = () => {
    deckRef.current?.style.setProperty("--ry", "0deg");
    deckRef.current?.style.setProperty("--rx", "0deg");
  };

  const spotlight = (event: PointerEvent<HTMLAnchorElement>) => {
    const button = event.currentTarget;
    const box = button.getBoundingClientRect();
    button.style.setProperty("--mx", `${event.clientX - box.left}px`);
    button.style.setProperty("--my", `${event.clientY - box.top}px`);
  };

  return <section ref={sectionRef} className="bh" aria-label={t("Explore Boys & Girlz")}>
    <div className="bh-aurora" aria-hidden="true">
      <span className="bh-blob bh-blob-pink" />
      <span className="bh-blob bh-blob-blue" />
      <span className="bh-blob bh-blob-peach" />
      <span className="bh-grain" />
    </div>

    <div className="bh-inner page-width">
      <div className="bh-copy">
        <span className="bh-kicker">
          <span className="bh-pulse" aria-hidden="true"><Heart size={13} /></span>
          {t("Made for little moments")}
        </span>
        <h1 className="bh-title">
          <span className="sr-only">{lineOne} {lineTwo}</span>
          <span className="bh-line" aria-hidden="true"><AnimatedLine text={lineOne} start={0} byWord={byWord} /></span>
          <span className="bh-line bh-line-accent" aria-hidden="true"><AnimatedLine text={lineTwo} start={lineOne.length} gradient byWord={byWord} /></span>
        </h1>
        <p className="bh-body">{t("A children's clothing shop in Lebanon, with little finds for every day.")}</p>
        <div className="bh-actions">
          <Link className="bh-cta" to="/shop" onPointerMove={spotlight}>
            <span className="bh-cta-spot" aria-hidden="true" />
            <span className="bh-cta-shine" aria-hidden="true" />
            <span className="bh-cta-label">{t("Explore the shop")}</span>
            <span className="bh-cta-arrow" aria-hidden="true"><ArrowRight size={18} /></span>
          </Link>
        </div>
      </div>

      <div className="bh-stage" onPointerMove={tilt} onPointerLeave={resetTilt} aria-hidden="true">
        <div className="bh-deck" ref={deckRef}>
          {photos.map((photo) => <div className={`bh-card bh-card-${photo.pos}`} key={photo.pos}>
            <div className="bh-card-scroll" data-scroll={photo.pos}>
              <div className="bh-card-in">
                <img src={photo.src} alt="" loading="eager" decoding="async" />
              </div>
            </div>
          </div>)}

          <div className="bh-badge bh-badge-delivery">
            <span className="bh-badge-icon bh-badge-icon-truck"><span className="bh-road" /><Truck size={18} /></span>
            <span><strong>{t("FREE delivery")}</strong><small>{t("all over Lebanon on orders over $99")}</small></span>
            <svg className="bh-check" viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" /></svg>
          </div>
          <div className="bh-badge bh-badge-cod">
            <span className="bh-badge-icon bh-badge-icon-pink bh-badge-icon-heart"><Heart size={17} /></span>
            <span><strong>{t("Cash on Delivery available")}</strong></span>
            <svg className="bh-check" viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" /></svg>
          </div>

          <div className="bh-mascot-wrap">
            <span className="home-mascot home-mascot-boy bh-mascot bh-mascot-boy" />
            <span className="home-mascot home-mascot-girl bh-mascot bh-mascot-girl" />
          </div>
        </div>
      </div>
    </div>
  </section>;
}
