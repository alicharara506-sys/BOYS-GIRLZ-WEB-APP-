import { useEffect, useRef, type PointerEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { Leaf, Shirt, Sun } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "../hooks/useExperience";
import { useLocale } from "../i18n/Locale";

gsap.registerPlugin(ScrollTrigger);

export type PromiseCardItem = { key: string; Icon: LucideIcon; title: string; body: string };
const promises: PromiseCardItem[] = [
  { key: "leaf", Icon: Leaf, title: "Soft on little skin", body: "Gentle, breathable fabrics" },
  { key: "sun", Icon: Sun, title: "Made for everyday play", body: "Comfortable and durable" },
  { key: "shirt", Icon: Shirt, title: "Easy size guide", body: "Find the perfect fit" },
];

// Tilts the card toward the cursor, or the finger while it presses, and moves its light to follow it.
function follow(event: PointerEvent<HTMLDivElement>) {
  const card = event.currentTarget;
  const box = card.getBoundingClientRect();
  const x = (event.clientX - box.left) / box.width;
  const y = (event.clientY - box.top) / box.height;
  card.style.setProperty("--mx", `${x * 100}%`);
  card.style.setProperty("--my", `${y * 100}%`);
  card.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
  card.style.setProperty("--ry", `${(x - 0.5) * 8}deg`);
}
// A finger lifting lets the card spring back; a mouse keeps its tilt until it leaves.
function release(event: PointerEvent<HTMLDivElement>) {
  if (event.pointerType !== "mouse") settle(event);
}
function settle(event: PointerEvent<HTMLDivElement>) {
  event.currentTarget.style.setProperty("--rx", "0deg");
  event.currentTarget.style.setProperty("--ry", "0deg");
}

// Why shop with us, as three cards each in its own colour: an icon chip that draws itself as the
// cards rise in, a soft shade of its colour glowing in the corner, a dot texture and a bar of colour along the foot. A
// shiny arc always runs round each border and widens on hover, while the card lifts and tilts
// toward the cursor. The middle card sits lower and the three drift at different speeds on scroll.
export default function PromiseCards({ items = promises, label = "Why shop with us", headingTag: Heading = "strong" }: { items?: PromiseCardItem[]; label?: string; headingTag?: "strong" | "h2" }) {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();
  const rowRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row || reduceMotion) return;
    const ctx = gsap.context(() => {
      const strokes = gsap.utils.toArray<SVGGeometryElement>(".promise-icon svg > *");
      strokes.forEach((stroke) => {
        const length = Math.ceil(stroke.getTotalLength?.() || 60);
        gsap.set(stroke, { strokeDasharray: length, strokeDashoffset: length });
      });
      gsap.timeline({ scrollTrigger: { trigger: row, start: "top 88%", once: true } })
        .from(".promise-card", { y: 40, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.15, clearProps: "transform,opacity" })
        .to(strokes, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", stagger: 0.05, clearProps: "strokeDasharray,strokeDashoffset" }, 0.35);
      // Each column drifts at its own speed while the section scrolls past (on wide screens).
      const media = gsap.matchMedia();
      media.add("(min-width: 901px)", () => {
        gsap.utils.toArray<HTMLElement>(".promise-drift").forEach((column, index) =>
          gsap.fromTo(column, { y: [24, 44, 32][index] }, {
            y: [-24, -44, -32][index], ease: "none",
            scrollTrigger: { trigger: row, start: "top bottom", end: "bottom top", scrub: 0.6 },
          }));
      });
      // Stacked on phones: each card swings up out of the page in 3D as it scrolls into view,
      // the outer two from opposite sides.
      media.add("(max-width: 900px)", () => {
        gsap.utils.toArray<HTMLElement>(".promise-drift").forEach((column, index) =>
          gsap.fromTo(column, { rotateX: 32, rotateY: [-14, 0, 14][index], scale: 0.92, transformPerspective: 900, transformOrigin: "50% 100%" }, {
            rotateX: 0, rotateY: 0, scale: 1, ease: "none",
            scrollTrigger: { trigger: column, start: "top bottom", end: "top 62%", scrub: 0.6 },
          }));
      });
    }, row);
    return () => ctx.revert();
  }, [reduceMotion]);

  return <section ref={rowRef} className="promise page-width" aria-label={t(label)}>
    {items.map(({ key, Icon, title, body }) => <div className="promise-drift" key={key}>
      <div className={`promise-card promise-card-${key}`} onPointerDown={follow} onPointerMove={follow} onPointerUp={release} onPointerCancel={settle} onPointerLeave={settle}>
        <span className="promise-dots" aria-hidden="true" />
        <span className="promise-shade" aria-hidden="true" />
        <span className="promise-icon" aria-hidden="true"><Icon size={24} strokeWidth={1.7} /></span>
        <Heading>{t(title)}</Heading>
        <small>{t(body)}</small>
        <span className="promise-bar" aria-hidden="true" />
      </div>
    </div>)}
  </section>;
}
