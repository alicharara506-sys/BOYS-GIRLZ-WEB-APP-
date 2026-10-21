import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PromiseCards from "./PromiseCards";
import { useReducedMotion } from "../hooks/useExperience";
import { useLocale } from "../i18n/Locale";

gsap.registerPlugin(ScrollTrigger);

const sparkles = [
  { x: 14, y: 22, size: 18, delay: "0s" },
  { x: 84, y: 16, size: 14, delay: "-1.4s" },
  { x: 22, y: 78, size: 12, delay: "-2.6s" },
  { x: 78, y: 70, size: 20, delay: "-0.8s" },
  { x: 50, y: 6, size: 10, delay: "-3.2s" },
];

function spotlight(event: PointerEvent<HTMLAnchorElement>) {
  const box = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mx", `${event.clientX - box.left}px`);
  event.currentTarget.style.setProperty("--my", `${event.clientY - box.top}px`);
}

// The outlet, open on the page: soft fields of pink and blue drifting behind a centred
// headline with sparkles twinkling round it, then why shop with us, then the way in.
export default function OutletFeature() {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const heading = t("Lovely finds. Lighter prices.");
  const split = heading.indexOf(". ");
  const lastSpace = heading.lastIndexOf(" ");
  const cut = split > 0 ? split + 2 : lastSpace > 0 ? lastSpace + 1 : 0;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduceMotion) return;
    const ctx = gsap.context(() => {
      gsap.from(".outlet-action", {
        y: 24, opacity: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: ".outlet-action", start: "top 92%", once: true },
      });
      gsap.from(".outlet-copy > *", {
        y: 28, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.09,
        scrollTrigger: { trigger: section, start: "top 80%", once: true },
      });
    }, section);
    return () => ctx.revert();
  }, [reduceMotion]);

  return <section ref={sectionRef} className="outlet" aria-labelledby="outlet-heading">
    <div className="outlet-fields" aria-hidden="true">
      <span className="outlet-field outlet-field-pink" />
      <span className="outlet-field outlet-field-blue" />
      <span className="outlet-field outlet-field-peach" />
      <span className="outlet-field outlet-field-sky" />
    </div>

    <div className="outlet-inner page-width">
      <div className="outlet-copy">
        <div className="section-eyebrow">
          <span aria-hidden="true" />
          <span className="section-eyebrow-text">{t("A little more to love")}</span>
          <span aria-hidden="true" />
        </div>
        <h2 id="outlet-heading">
          {heading.slice(0, cut)}<span className="outlet-gradient">{heading.slice(cut)}</span>
        </h2>
        <p>{t("Explore our Like New outlet favorites, carefully chosen for their next little chapter.")}</p>
        <span className="outlet-sparkles" aria-hidden="true">
          {sparkles.map((sparkle) => <svg key={sparkle.delay} viewBox="0 0 24 24" style={{ insetInlineStart: `${sparkle.x}%`, top: `${sparkle.y}%`, width: sparkle.size, height: sparkle.size, animationDelay: sparkle.delay } as CSSProperties}>
            <path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0z" />
          </svg>)}
        </span>
      </div>

      <PromiseCards />

      <div className="outlet-action">
        <Link className="bh-cta outlet-cta" to="/category/outlet" onPointerMove={spotlight}>
          <span className="bh-cta-spot" aria-hidden="true" />
          <span className="bh-cta-shine" aria-hidden="true" />
          <span className="bh-cta-label">{t("Shop the outlet")}</span>
          <span className="bh-cta-arrow" aria-hidden="true"><ArrowRight size={18} /></span>
        </Link>
      </div>
    </div>
  </section>;
}
