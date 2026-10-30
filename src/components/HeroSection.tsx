import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Link } from "react-router";
import { ArrowRight, Heart, Truck } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "../hooks/useExperience";
import { useLocale } from "../i18n/Locale";

gsap.registerPlugin(ScrollTrigger);

const mix = (from: number[], to: number[], p: number) => `rgb(${from.map((value, i) => Math.round(value + (to[i] - value) * p)).join(",")})`;
const pink = [252, 83, 142];
const blue = [0, 179, 252];

type Kid = "boy" | "girl";
const sparkles = Array.from({ length: 8 }, (_, i) => ({ angle: i * 45, kind: i % 2 ? "★" : "♥" }));
const confettiPieces = Array.from({ length: 14 }, (_, i) => ({ angle: i * (360 / 14) + (i % 2) * 8, distance: 70 + (i % 3) * 26 }));


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
        // Gradient lines blend smoothly from pink into blue across their letters (word by word in Arabic).
        const style = { "--i": start + i, ...(gradient ? { color: mix(pink, blue, total > 1 ? i / (total - 1) : 0) } : {}) } as CSSProperties;
        return <span className="bh-letter" style={style} key={p}>{part}</span>;
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
  const lineOne = t("Little clothes,");
  const lineTwo = t("for big smiles.");
  const byWord = language === "ar";

  const stageRef = useRef<HTMLDivElement>(null);
  const [tint, setTint] = useState<Kid | "">("");
  const [jumping, setJumping] = useState<Record<Kid, string>>({ boy: "", girl: "" });
  const [bursts, setBursts] = useState<{ id: number; kid: Kid }[]>([]);
  const burstId = useRef(0);
  // Scrolling away: the two slide apart and the copy rises.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduceMotion) return;
    const ctx = gsap.context(() => {
      gsap.timeline({ scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: 0.6 } })
        .to(".play-kid-boy .play-scroll", { xPercent: -45, yPercent: 10, rotate: -8 }, 0)
        .to(".play-kid-girl .play-scroll", { xPercent: 45, yPercent: 10, rotate: 8 }, 0)
        .to(".play-disc", { scaleX: 1.4, opacity: 0 }, 0)
        .to(".bh-copy", { y: -60, opacity: 0.2 }, 0)
        .to(".bh-aurora", { yPercent: 6 }, 0);
    }, section);
    return () => ctx.revert();
  }, [reduceMotion]);

  const jump = (kid: Kid, kind: "jump" | "hop") => {
    setJumping((current) => current[kid] ? current : { ...current, [kid]: kind });
    if (kind === "jump") {
      const id = ++burstId.current;
      setBursts((current) => [...current, { id, kid }]);
      window.setTimeout(() => setBursts((current) => current.filter((b) => b.id !== id)), 1100);
    }
  };
  const landed = (kid: Kid) => setJumping((current) => ({ ...current, [kid]: "" }));

  // While nothing is happening, one of them does a little hop every few seconds.
  useEffect(() => {
    if (reduceMotion) return;
    let turn = 0;
    const timer = window.setInterval(() => {
      if (document.hidden || tint) return;
      jump(turn++ % 2 ? "girl" : "boy", "hop");
    }, 4200);
    return () => window.clearInterval(timer);
  }, [reduceMotion, tint]);

  // Both characters lean toward the cursor for depth.
  const follow = (event: PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage || reduceMotion || event.pointerType !== "mouse") return;
    const box = stage.getBoundingClientRect();
    stage.style.setProperty("--px", ((event.clientX - box.left) / box.width - 0.5).toFixed(3));
    stage.style.setProperty("--py", ((event.clientY - box.top) / box.height - 0.5).toFixed(3));
  };
  const settle = () => {
    stageRef.current?.style.setProperty("--px", "0");
    stageRef.current?.style.setProperty("--py", "0");
    setTint("");
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

      <div className={`bh-stage play ${tint ? `is-${tint}` : ""}`} ref={stageRef} onPointerMove={follow} onPointerLeave={settle} aria-hidden="true">
        <span className="play-glow play-glow-base" />
        <span className="play-glow play-glow-boy" />
        <span className="play-glow play-glow-girl" />

        <span className="play-disc" />
        <span className="play-ripple" />
        <span className="play-sparkles">
          {sparkles.map(({ angle, kind }, i) => <i key={i} style={{ "--a": `${angle}deg` } as CSSProperties}>{kind}</i>)}
        </span>

        {(["boy", "girl"] as Kid[]).map((kid) => <div className={`play-kid play-kid-${kid}`} key={kid}>
          <div className="play-scroll">
            <div className="play-lean">
              <button type="button" tabIndex={-1} className={`play-hit ${jumping[kid] ? `is-${jumping[kid]}` : ""}`}
                onClick={() => jump(kid, "jump")} onPointerEnter={() => setTint(kid)} onAnimationEnd={(e) => { if (e.target === e.currentTarget) landed(kid); }}>
                <span className="play-drop">
                  <span className={`home-mascot home-mascot-${kid} bh-mascot play-sprite`} />
                </span>
              </button>
              <span className="play-shadow" />
            </div>
          </div>
          {bursts.filter((b) => b.kid === kid).map((b) => <span className="play-confetti" key={b.id}>
            {confettiPieces.map((piece, i) => <i key={i} style={{ "--a": `${piece.angle}deg`, "--d": `${piece.distance}px` } as CSSProperties} />)}
          </span>)}
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
      </div>
    </div>
  </section>;
}
