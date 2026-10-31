import { useEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { WhatsAppIcon } from "./SocialIcons";
import { whatsAppUrl } from "./WhatsAppLink";
import { SplitTitle } from "./HeroSection";
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

// The closing call to the shop on WhatsApp: soft fields of pink and blue drifting behind a
// centred headline, sparkles twinkling round it, and the boy and girl peeking in from the sides.
export default function HelpCTA() {
  const { t, language } = useLocale();
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const whatsapp = whatsAppUrl(t("Hello Boys & Girlz! I need help choosing a size."));

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduceMotion) return;
    const ctx = gsap.context(() => {
      gsap.from(".help-cta-copy > *, .help-cta-action", {
        y: 28, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.09,
        scrollTrigger: { trigger: section, start: "top 80%", once: true },
      });
      gsap.from(".help-cta-kid", {
        y: 60, opacity: 0, duration: 1, ease: "back.out(1.7)", stagger: 0.15, clearProps: "transform,opacity",
        scrollTrigger: { trigger: section, start: "top 75%", once: true },
      });
    }, section);
    return () => ctx.revert();
  }, [reduceMotion]);

  if (!whatsapp) return null;
  return <section ref={sectionRef} className="help-cta" aria-labelledby="help-cta-heading">
    <div className="help-cta-fields" aria-hidden="true">
      <span className="help-cta-field help-cta-field-pink" />
      <span className="help-cta-field help-cta-field-blue" />
      <span className="help-cta-field help-cta-field-peach" />
      <span className="help-cta-field help-cta-field-sky" />
    </div>
    <div className="help-cta-inner page-width">
      <span className="home-mascot home-mascot-boy help-cta-kid help-cta-kid-boy" aria-hidden="true" />
      <span className="home-mascot home-mascot-girl help-cta-kid help-cta-kid-girl" aria-hidden="true" />
      <div className="help-cta-copy">
        <div className="section-eyebrow">
          <span aria-hidden="true" />
          <span className="section-eyebrow-text">{t("We're here to help")}</span>
          <span aria-hidden="true" />
        </div>
        <h2 id="help-cta-heading"><SplitTitle text={t("Not sure which size is right for them?")} byWord={language === "ar"} /></h2>
        <p>{t("Send us a message. We'll reply with honest advice on sizes, availability and prices.")}</p>
        <span className="help-cta-sparkles" aria-hidden="true">
          {sparkles.map((sparkle) => <svg key={sparkle.delay} viewBox="0 0 24 24" style={{ insetInlineStart: `${sparkle.x}%`, top: `${sparkle.y}%`, width: sparkle.size, height: sparkle.size, animationDelay: sparkle.delay } as CSSProperties}>
            <path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0z" />
          </svg>)}
        </span>
      </div>
      <div className="help-cta-action">
        <a className="help-cta-wa" href={whatsapp} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon size={24} /> {t("Chat on WhatsApp")}
        </a>
      </div>
    </div>
  </section>;
}
