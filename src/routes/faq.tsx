import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { Link } from "../components/LocalizedLink";
import { ArrowRight, Banknote, Plus, Recycle, RotateCcw, Ruler, Search, Truck, X, type LucideIcon } from "lucide-react";
import { business } from "../config/business";
import { localizedMeta } from "../config/meta";
import { useLocale } from "../i18n/Locale";
import { SplitTitle } from "../components/HeroSection";
import { faqs } from "../data/faqs";

const presentation: Record<(typeof faqs)[number]["id"], { Icon: LucideIcon; tint: string }> = {
  delivery: { Icon: Truck, tint: "#0898d6" },
  payment: { Icon: Banknote, tint: "#16a36d" },
  returns: { Icon: RotateCcw, tint: "#e7a400" },
  sizes: { Icon: Ruler, tint: "#0898d6" },
  outlet: { Icon: Recycle, tint: "#fc538e" },
};

export const meta = localizedMeta("Frequently asked questions", "Answers about Boys & Girlz delivery in Lebanon, Cash on Delivery, returns, sizes and Like New outlet items.", "/faq");

// Wraps every match of the search in a highlight.
function highlight(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.split(new RegExp(`(${escaped})`, "gi")).map((part, i) => i % 2 ? <mark key={i}>{part}</mark> : part);
}

function spotlight(event: PointerEvent<HTMLElement>) {
  const box = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mx", `${event.clientX - box.left}px`);
  event.currentTarget.style.setProperty("--my", `${event.clientY - box.top}px`);
}

// Frequently asked questions: a springing headline, a search that filters and highlights as you
// type, topic chips, and the questions as glass cards that open one at a time. Each question has
// its own link (like /faq#delivery) that opens straight to it.
export default function FAQ() {
  const { language, t } = useLocale();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [open, setOpen] = useState<string>(faqs[0].id);
  const chipsRef = useRef<HTMLDivElement>(null);
  const heading = t("Frequently asked questions");

  // A link to one question (like /faq#delivery) shows all topics and opens it.
  useEffect(() => {
    const openFromHash = () => {
      const id = window.location.hash.slice(1);
      if (!faqs.some((faq) => faq.id === id)) return;
      setTopic("all");
      setQuery("");
      setOpen(id);
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  // The chip highlight glides to the chosen topic.
  useEffect(() => {
    const bar = chipsRef.current;
    const active = bar?.querySelector<HTMLElement>("button.active");
    if (!bar || !active) return;
    bar.style.setProperty("--pill-x", `${active.offsetLeft}px`);
    bar.style.setProperty("--pill-w", `${active.offsetWidth}px`);
  }, [topic, language]);

  const toggle = (id: string) => {
    const next = open === id ? "" : id;
    setOpen(next);
    window.history.replaceState(null, "", next ? `#${next}` : `${window.location.pathname}${window.location.search}`);
  };
  const q = query.trim().toLowerCase();
  const visible = faqs.filter((faq) => (topic === "all" || faq.id === topic) &&
    (!q || `${t(faq.question)} ${t(faq.answer)}`.toLowerCase().includes(q)));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: visible.map(({ question, answer }) => ({
      "@type": "Question",
      name: t(question),
      acceptedAnswer: { "@type": "Answer", text: t(answer) },
    })),
  };
  return (
    <div className="faq-page">
      {visible.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <section className="contact-hero page-width">
        <div className="about-fields" aria-hidden="true">
          <span className="about-field about-field-pink" />
          <span className="about-field about-field-blue" />
        </div>
        <span className="bh-kicker"><span className="bh-pulse" aria-hidden="true"><Plus size={13} /></span>{t("Here to help")}</span>
        <h1 className="contact-title">
          <SplitTitle text={heading} byWord={language === "ar"} />
        </h1>
        <p className="contact-lead">{language === "ar" ? `إجابات عن التسوّق من ${business.name} في لبنان.` : `Answers about shopping with ${business.name} in Lebanon.`}</p>
      </section>

      <section className="faq-body page-width">
        <div className="faq-search">
          <Search size={19} aria-hidden="true" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Search the questions")} aria-label={t("Search the questions")} />
          {query && <button type="button" onClick={() => setQuery("")} aria-label={t("Clear search")}><X size={16} /></button>}
        </div>
        <div className="faq-topics" ref={chipsRef} role="group" aria-label={t("Frequently asked questions")}>
          <span className="faq-topics-pill" aria-hidden="true" />
          <button type="button" className={topic === "all" ? "active" : ""} aria-pressed={topic === "all"} onClick={() => setTopic("all")}>{t("All")}</button>
          {faqs.map((faq) => <button key={faq.id} type="button" className={topic === faq.id ? "active" : ""} aria-pressed={topic === faq.id}
            onClick={() => { setTopic(faq.id); setOpen(faq.id); }}>{t(faq.topic)}</button>)}
        </div>

        <div className="faq-list">
          {visible.map(({ id, question, answer, relatedPath, relatedLabel }, index) => {
            const { Icon, tint } = presentation[id];
            const isOpen = open === id || Boolean(q);
            return <section id={id} key={id} className={`faq-item ${isOpen ? "is-open" : ""}`} style={{ "--tint": tint, "--i": index } as CSSProperties} onPointerMove={spotlight}>
              <h2>
                <button type="button" aria-expanded={isOpen} aria-controls={`${id}-answer`} onClick={() => toggle(id)}>
                  <span className="faq-icon" aria-hidden="true"><Icon size={19} /></span>
                  <span className="faq-question">{highlight(t(question), query)}</span>
                  <span className="faq-toggle" aria-hidden="true"><Plus size={18} /></span>
                </button>
              </h2>
              <div className="faq-answer" id={`${id}-answer`} role="region" aria-label={t(question)}>
                <div><p>{highlight(t(answer), query)}</p><p><Link className="inline-flex items-center gap-1 font-semibold" to={relatedPath}>{t(relatedLabel)} <ArrowRight size={14} aria-hidden="true" /></Link></p></div>
              </div>
            </section>;
          })}
          {!visible.length && <div className="faq-empty">
            <span className="shop-empty-mascots" aria-hidden="true"><span className="home-mascot home-mascot-boy" /><span className="home-mascot home-mascot-girl" /></span>
            <h2>{t("No little matches just yet.")}</h2>
          </div>}
        </div>
      </section>

      <section className="faq-more page-width">
        <div className="about-fields" aria-hidden="true">
          <span className="about-field about-field-pink" />
          <span className="about-field about-field-blue" />
        </div>
        <span className="faq-more-mascots" aria-hidden="true"><span className="home-mascot home-mascot-boy" /><span className="home-mascot home-mascot-girl" /></span>
        <h2>{t("Still have a question?")}</h2>
        <Link className="bh-cta" to="/contact" onPointerMove={spotlight}>
          <span className="bh-cta-spot" aria-hidden="true" />
          <span className="bh-cta-shine" aria-hidden="true" />
          <span className="bh-cta-label">{t("Contact us")}</span>
          <span className="bh-cta-arrow" aria-hidden="true"><ArrowRight size={18} /></span>
        </Link>
      </section>
    </div>
  );
}
