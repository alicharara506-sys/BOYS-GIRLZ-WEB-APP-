import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Link } from "react-router";
import { ArrowRight, Baby, Heart, Shirt, Sparkles, Star, Sun, Truck, type LucideIcon } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "../hooks/useExperience";
import { useLocale } from "../i18n/Locale";

gsap.registerPlugin(ScrollTrigger);

const mix = (from: number[], to: number[], p: number) => `rgb(${from.map((value, i) => Math.round(value + (to[i] - value) * p)).join(",")})`;
const pink = [252, 83, 142];
const blue = [0, 179, 252];

type Kid = "boy" | "girl";
// The little things orbiting the stage: [icon, colour, ring (0 outer, 1 inner), starting angle].
const orbitChips: [LucideIcon, string, 0 | 1, number][] = [
  [Shirt, "#00b3fc", 0, 0], [Heart, "#fc538e", 0, 72], [Star, "#f5a400", 0, 144], [Sun, "#ff8a3d", 0, 216], [Sparkles, "#fc538e", 0, 288],
  [Baby, "#fc538e", 1, 40], [Star, "#00b3fc", 1, 160], [Heart, "#00b3fc", 1, 280],
];
// One turn every 40s on the outer ring and 28s the other way on the inner one.
const ringSpeed = [(Math.PI * 2) / 40, -(Math.PI * 2) / 28];
const TILT = 0.3;
type Geometry = { w: number; h: number; cx: number; cy: number; rx: [number, number]; ry: [number, number]; links: string[] };
const geometryFor = (w: number, h: number, links: string[] = []): Geometry => {
  const outer = Math.min(w * (w < 600 ? 0.42 : 0.47), 330);
  const inner = Math.min(w * (w < 600 ? 0.3 : 0.33), 230);
  return { w, h, cx: w / 2, cy: h * 0.7, rx: [outer, inner], ry: [outer * TILT, inner * TILT], links };
};
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
  const chipRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const tintRef = useRef<Kid | "">("");
  const scrollRef = useRef(0);
  const [geo, setGeo] = useState<Geometry>(() => geometryFor(640, 560));
  const geoRef = useRef(geo);
  tintRef.current = tint;

  // Measure the stage, and draw the dotted lines from each card down to the stand.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const box = stage.getBoundingClientRect();
      const disc = stage.querySelector(".play-disc")?.getBoundingClientRect();
      const links = [...stage.querySelectorAll<HTMLElement>(".bh-badge")].map((card) => {
        if (!disc) return "";
        const c = { left: card.offsetLeft, top: card.offsetTop, width: card.offsetWidth, height: card.offsetHeight };
        const fromX = c.left + c.width / 2;
        const fromY = c.top + c.height;
        const toward = fromX < box.width / 2 ? -1 : 1;
        const toX = box.width / 2 + toward * disc.width * 0.47;
        const toY = disc.top + disc.height * 0.5 - box.top;
        return `M${fromX},${fromY} C${fromX},${(fromY + toY) / 2} ${toX},${fromY + (toY - fromY) * 0.35} ${toX},${toY}`;
      });
      const next = geometryFor(box.width, box.height, links);
      geoRef.current = next;
      setGeo(next);
    };
    measure();
    const late = window.setTimeout(measure, 2600);
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => { observer.disconnect(); window.clearTimeout(late); };
  }, [language]);

  // The orbiting chips, placed every frame: those on the front half pass in front of the two
  // characters, bigger and brighter; those at the back pass behind them, smaller and fainter.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const intro = orbitChips.map(() => ({ p: reduceMotion ? 1 : 0 }));
    const tweens = reduceMotion ? [] : intro.map((item, i) => gsap.to(item, { p: 1, duration: 0.9, ease: "back.out(1.7)", delay: 1.5 + i * 0.09 }));
    const trigger = reduceMotion ? null : ScrollTrigger.create({ trigger: stage, start: "top top", end: "bottom top", onUpdate: (self) => { scrollRef.current = self.progress; } });
    let elapsed = 0;
    const place = (_time?: number, delta = 0) => {
      elapsed += delta / 1000;
      const g = geoRef.current;
      const spread = 1 + scrollRef.current * 0.45;
      const fade = 1 - scrollRef.current;
      const points: { x: number; y: number; i: number }[] = [];
      orbitChips.forEach(([, , ring, start], i) => {
        const chip = chipRefs.current[i];
        if (!chip) return;
        const angle = (start * Math.PI) / 180 + (reduceMotion ? 0 : elapsed * ringSpeed[ring]);
        const depth = Math.sin(angle);
        const p = intro[i].p;
        const x = g.cx + Math.cos(angle) * g.rx[ring] * spread;
        const y = g.cy + depth * g.ry[ring] * spread;
        const front = depth > 0;
        const pulse = Math.max(0, (depth - 0.82) / 0.18) * 0.14;
        const scale = (0.72 + 0.34 * (depth + 1) / 2 + pulse) * (0.3 + 0.7 * p);
        chip.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
        chip.style.opacity = String(((front ? 1 : 0.45 + 0.55 * (depth + 1)) * Math.min(1, p) * fade).toFixed(3));
        chip.style.zIndex = front ? "4" : "1";
        chip.classList.toggle("is-front", depth > 0.82);
        points.push({ x, y, i });
      });
      // While a character is hovered, thin lines join it to its three nearest chips.
      const kid = tintRef.current;
      const lines = lineRefs.current;
      if (kid) {
        const kidBox = stage.querySelector(`.play-kid-${kid} .play-sprite`)?.getBoundingClientRect();
        const box = stage.getBoundingClientRect();
        if (kidBox) {
          const kx = kidBox.left + kidBox.width / 2 - box.left;
          const ky = kidBox.top + kidBox.height * 0.4 - box.top;
          points.sort((a, b) => Math.hypot(a.x - kx, a.y - ky) - Math.hypot(b.x - kx, b.y - ky)).slice(0, 3).forEach((point, n) => {
            lines[n]?.setAttribute("x1", kx.toFixed(1)); lines[n]?.setAttribute("y1", ky.toFixed(1));
            lines[n]?.setAttribute("x2", point.x.toFixed(1)); lines[n]?.setAttribute("y2", point.y.toFixed(1));
          });
        }
      }
    };
    place();
    if (reduceMotion) return () => trigger?.kill();
    gsap.ticker.add(place);
    return () => { gsap.ticker.remove(place); tweens.forEach((tw) => tw.kill()); trigger?.kill(); };
  }, [reduceMotion]);

  // Scrolling away: the two slide apart, the orbits widen and fade, the copy rises.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduceMotion) return;
    const ctx = gsap.context(() => {
      gsap.timeline({ scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: 0.6 } })
        .to(".play-kid-boy .play-scroll", { xPercent: -45, yPercent: 10, rotate: -8 }, 0)
        .to(".play-kid-girl .play-scroll", { xPercent: 45, yPercent: 10, rotate: 8 }, 0)
        .to(".play-rings", { opacity: 0 }, 0)
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

  // Both lean toward the cursor and the orbits shift behind them, for depth.
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

      <div className={`bh-stage play ${tint ? `is-${tint}` : ""}`} ref={stageRef} onPointerMove={follow} onPointerLeave={settle} aria-hidden="true">
        <span className="play-glow play-glow-base" />
        <span className="play-glow play-glow-boy" />
        <span className="play-glow play-glow-girl" />

        <svg className={`play-rings ${tint ? `is-${tint}` : ""}`} width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`}>
          <defs>
            <linearGradient id="play-ring-ink" x1="0" x2="1"><stop offset="0" stopColor="#fc538e" /><stop offset="1" stopColor="#00b3fc" /></linearGradient>
            <linearGradient id="play-ring-ink-2" x1="1" x2="0"><stop offset="0" stopColor="#fc538e" /><stop offset="1" stopColor="#00b3fc" /></linearGradient>
          </defs>
          {[0, 1].map((ring) => <g className={`play-ring play-ring-${ring}`} key={ring}>
            <path d={`M${geo.cx - geo.rx[ring]},${geo.cy} A${geo.rx[ring]},${geo.ry[ring]} 0 0 1 ${geo.cx + geo.rx[ring]},${geo.cy}`} pathLength={50} className="play-ring-line" stroke={`url(#play-ring-ink${ring ? "-2" : ""})`} />
            <ellipse cx={geo.cx} cy={geo.cy} rx={geo.rx[ring]} ry={geo.ry[ring]} pathLength={100} className="play-ring-comet" />
          </g>)}
          {geo.links.map((d, i) => d && <g className="play-link" key={i}>
            <path d={d} pathLength={100} className="play-link-line" />
            <path d={d} pathLength={100} className="play-link-dot" style={{ animationDelay: `${i * -1.2}s` }} />
          </g>)}
        </svg>
        {orbitChips.map(([Icon, color], i) => <span className="play-chip" key={i} ref={(el) => { chipRefs.current[i] = el; }} style={{ "--c": color } as CSSProperties}>
          <Icon size={18} strokeWidth={2.2} />
        </span>)}

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

        <svg className={`play-rings play-rings-front ${tint ? `is-${tint}` : ""}`} width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`}>
          {[0, 1].map((ring) => <path key={ring} className={`play-ring-line play-ring-front play-ring-${ring}`} pathLength={50} stroke={`url(#play-ring-ink${ring ? "-2" : ""})`}
            d={`M${geo.cx - geo.rx[ring]},${geo.cy} A${geo.rx[ring]},${geo.ry[ring]} 0 0 0 ${geo.cx + geo.rx[ring]},${geo.cy}`} />)}
          {[0, 1, 2].map((n) => <line key={n} ref={(el) => { lineRefs.current[n] = el; }} className="play-constellation" />)}
        </svg>
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
