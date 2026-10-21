import { Link, useParams } from "react-router-dom";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Heart,
  MapPin,
  Baby,
  Banknote,
  Clock,
  HandHeart,
  Info,
  RotateCcw,
  type LucideIcon,
  Sparkles,
  Store,
  Phone,
  Check,
  Leaf,
  Truck,
} from "lucide-react";
import { business } from "../config/business";
import { sizeOptions } from "../data/products";
import { whatsAppUrl } from "../components/WhatsAppLink";
import { socials, WhatsAppIcon } from "../components/SocialIcons";
import { useLocale } from "../i18n/Locale";
import { AnimatedLine, SplitTitle } from "../components/HeroSection";
import PromiseCards, { type PromiseCardItem } from "../components/PromiseCards";
import { useReducedMotion } from "../hooks/useExperience";

gsap.registerPlugin(ScrollTrigger);
// Tilts the photo frame toward the cursor; only for a mouse.
function tiltFrame(event: PointerEvent<HTMLDivElement>) {
  if (event.pointerType !== "mouse") return;
  const box = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--rx", `${(0.5 - (event.clientY - box.top) / box.height) * 8}deg`);
  event.currentTarget.style.setProperty("--ry", `${((event.clientX - box.left) / box.width - 0.5) * 10}deg`);
}
function settleFrame(event: PointerEvent<HTMLDivElement>) {
  event.currentTarget.style.setProperty("--rx", "0deg");
  event.currentTarget.style.setProperty("--ry", "0deg");
}
function spotlight(event: PointerEvent<HTMLAnchorElement>) {
  const box = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mx", `${event.clientX - box.left}px`);
  event.currentTarget.style.setProperty("--my", `${event.clientY - box.top}px`);
}

const values: PromiseCardItem[] = [
  { key: "heart", Icon: Heart, title: "Chosen with love", body: "Thoughtful details for the everyday." },
  { key: "leaf", Icon: Leaf, title: "Comfort comes first", body: "Softness for their little adventures." },
  { key: "truck", Icon: Truck, title: "A little closer", body: "Lovely things, delivered to your door." },
];

// The story of the shop: a springing headline beside a tilting photo frame, the story as a
// timeline that lights up as it scrolls, the shop's values as cards, then the way into the shop.
export function About() {
  const { t, language } = useLocale();
  const reduceMotion = useReducedMotion();
  const timelineRef = useRef<HTMLOListElement>(null);
  const lineOne = t("For their firsts.");
  const lineTwo = t("And everything after.");

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline || reduceMotion) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".about-line-fill", { scaleY: 0 }, {
        scaleY: 1, ease: "none",
        scrollTrigger: { trigger: timeline, start: "top 70%", end: "bottom 55%", scrub: 0.5 },
      });
      gsap.utils.toArray<HTMLElement>(".about-step").forEach((step) => {
        ScrollTrigger.create({ trigger: step, start: "top 68%", end: "bottom 30%", toggleClass: "is-lit", onEnter: () => step.classList.add("was-lit") });
        gsap.from(step.querySelector(".about-step-body"), {
          x: language === "ar" ? -30 : 30, opacity: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: step, start: "top 85%", once: true },
        });
      });
    }, timeline);
    return () => ctx.revert();
  }, [reduceMotion, language]);

  return (
    <div className="about-page">
      <section className="about-hero page-width">
        <div className="about-fields" aria-hidden="true">
          <span className="about-field about-field-pink" />
          <span className="about-field about-field-blue" />
        </div>
        <div className="about-hero-copy">
          <span className="bh-kicker"><span className="bh-pulse" aria-hidden="true"><Heart size={13} /></span>{t("A little about us")}</span>
          <h1 className="about-title">
            <span className="sr-only">{lineOne} {lineTwo}</span>
            <span className="bh-line" aria-hidden="true"><AnimatedLine text={lineOne} start={0} byWord={language === "ar"} /></span>
            <span className="bh-line bh-line-accent" aria-hidden="true"><AnimatedLine text={lineTwo} start={lineOne.length} gradient byWord={language === "ar"} /></span>
          </h1>
          <p className="about-lead">{t("First smiles. First steps. The first time they insist on dressing themselves.")}</p>
        </div>
        <div className="about-frame" onPointerMove={tiltFrame} onPointerLeave={settleFrame}>
          <div className="about-frame-inner">
            <div className="story-image" role="img" aria-label={t("Happy babies in soft blue and pink outfits")} />
          </div>
          <span className="home-mascot home-mascot-boy about-mascot about-mascot-boy" aria-hidden="true" />
          <span className="home-mascot home-mascot-girl about-mascot about-mascot-girl" aria-hidden="true" />
        </div>
      </section>

      <section className="about-story page-width" aria-label={t("A little about us")}>
        <ol className="about-timeline" ref={timelineRef}>
          <span className="about-line" aria-hidden="true"><span className="about-line-fill" /></span>
          <li className="about-step">
            <span className="about-dot" aria-hidden="true"><Sparkles size={16} /></span>
            <div className="about-step-body">
              <p>{t("Boys & Girlz is a children's clothing shop in Lebanon offering kids clothes, toys, accessories, maternity pieces, and Like New outlet finds for growing families.")}</p>
            </div>
          </li>
          <li className="about-step">
            <span className="about-dot" aria-hidden="true"><Store size={16} /></span>
            <div className="about-step-body about-question">
              <h2>{t("What is Boys & Girlz?")}</h2>
              <p>{t("We are an online baby shop in Lebanon and a family-friendly retail destination where comfort, practical value, and cheerful design come first.")}</p>
            </div>
          </li>
          <li className="about-step">
            <span className="about-dot" aria-hidden="true"><MapPin size={16} /></span>
            <div className="about-step-body about-question">
              <h2>{t("Where do you ship?")}</h2>
              <p>{t("We ship within Lebanon only. Every order is prepared locally with care.")}</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="about-values page-width">
        <PromiseCards items={values} label="A little about us" />
      </section>

      <section className="about-cta">
        <div className="about-fields" aria-hidden="true">
          <span className="about-field about-field-pink" />
          <span className="about-field about-field-blue" />
        </div>
        <Link to="/shop" className="bh-cta" onPointerMove={spotlight}>
          <span className="bh-cta-spot" aria-hidden="true" />
          <span className="bh-cta-shine" aria-hidden="true" />
          <span className="bh-cta-label">{t("Meet your next favorite")}</span>
          <span className="bh-cta-arrow" aria-hidden="true"><ArrowRight size={18} /></span>
        </Link>
      </section>
    </div>
  );
}
// A way to reach the shop, as a card in its own colour that lifts with a light following the cursor.
function ContactCard({ href, icon, title, value, tint, external = true }: { href?: string; icon: ReactNode; title: string; value: ReactNode; tint: string; external?: boolean }) {
  const follow = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${event.clientX - box.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - box.top}px`);
  };
  const body = <>
    <span className="contact-card-icon" aria-hidden="true">{icon}</span>
    <span className="contact-card-copy"><small>{title}</small><strong>{value}</strong></span>
    {href && <ArrowRight className="contact-card-arrow" size={18} aria-hidden="true" />}
  </>;
  const style = { "--tint": tint } as CSSProperties;
  return href
    ? <a className="contact-card" href={href} style={style} onPointerMove={follow} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{body}</a>
    : <div className="contact-card" style={style} onPointerMove={follow}>{body}</div>;
}

// Contact: a springing headline over drifting light, every way to reach the shop as cards, and the
// note form as a glass card with floating labels that turns into a thank-you with a burst of hearts.
export function Contact() {
  const { language, t } = useLocale();
  const [noteLength, setNoteLength] = useState(0);
  // The note goes to the shop on WhatsApp, written out with the name and email.
  const sendToWhatsApp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const [name, email, note] = ["fullName", "email", "message"].map((key) => String(form.get(key) || "").trim());
    const message = language === "ar"
      ? `مرحباً بويز آند غيرلز!\n${note}\n\nالاسم: ${name}\nالبريد الإلكتروني: ${email}`
      : `Hello Boys & Girlz!\n${note}\n\nName: ${name}\nEmail: ${email}`;
    const url = whatsAppUrl(message);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };
  const heading = t("A little hello goes a long way.");
  const whatsapp = whatsAppUrl(language === "ar" ? "مرحباً بويز آند غيرلز، لدي سؤال عن أحد المنتجات." : "Hello Boys & Girlz, I have a question about an item.");
  return (
    <div className="contact-page">
      <section className="contact-hero page-width">
        <div className="about-fields" aria-hidden="true">
          <span className="about-field about-field-pink" />
          <span className="about-field about-field-blue" />
        </div>
        <span className="bh-kicker"><span className="bh-pulse" aria-hidden="true"><Heart size={13} /></span>{t("We’re all ears")}</span>
        <h1 className="contact-title">
          <SplitTitle text={heading} byWord={language === "ar"} />
        </h1>
        <p className="contact-lead">{t("Questions about a little favorite? We’re here to help.")}</p>
      </section>


      <section className="contact-main page-width">
        <div className="contact-aside">
          <h2>{t("Let’s talk.")}</h2>
          <p>{t("For sizing, delivery, or a little advice, send a note below.")}</p>
          <div className="contact-cards" aria-label={t("Follow us")}>
            {whatsapp && <ContactCard href={whatsapp} icon={<WhatsAppIcon size={22} />} title={t("Chat with us")} value="WhatsApp" tint="#16a36d" />}
            {socials.map(({ name, handle, href, Icon, tint }) => <ContactCard key={name} href={href} icon={<Icon size={22} />} title={name} value={<span dir="ltr">{handle}</span>} tint={tint} />)}
            {business.phone && <ContactCard href={`tel:${business.phone}`} external={false} icon={<Phone size={22} />} title={t("Contact us")} value={<span dir="ltr">{business.phone}</span>} tint="#0898d6" />}
            {business.address && <ContactCard href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`} icon={<MapPin size={22} />} title={t("Visit us:").replace(/[:：]$/, "")} value={<>{business.address}{business.hours && <small className="contact-card-hours">{t("Opening hours:")} {business.hours}</small>}</>} tint="#e7a400" />}
          </div>
        </div>
        <div className="contact-form-wrap">
          <span className="home-mascot home-mascot-boy contact-mascot contact-mascot-boy" aria-hidden="true" />
          <span className="home-mascot home-mascot-girl contact-mascot contact-mascot-girl" aria-hidden="true" />
          <form className="contact-form contact-glass" onSubmit={sendToWhatsApp}>
            <div className="float-field">
              <input id="contact-name" required name="fullName" autoComplete="name" minLength={2} placeholder=" " />
              <label htmlFor="contact-name">{t("Your name")}</label>
              <Check className="float-ok" size={16} aria-hidden="true" />
            </div>
            <div className="float-field">
              <input id="contact-email" required type="email" name="email" autoComplete="email" placeholder=" " />
              <label htmlFor="contact-email">{t("Email address")}</label>
              <Check className="float-ok" size={16} aria-hidden="true" />
            </div>
            <div className="float-field float-field-note">
              <textarea id="contact-note" required name="message" rows={5} minLength={10} placeholder=" " onChange={(event) => setNoteLength(event.target.value.length)} />
              <label htmlFor="contact-note">{t("Your little note")}</label>
              <Check className="float-ok" size={16} aria-hidden="true" />
              <span className={`float-count ${noteLength >= 10 ? "is-enough" : ""}`} aria-hidden="true" dir="ltr">{noteLength} / 10+</span>
            </div>
            <button className="bh-cta contact-send" type="submit">
              <span className="bh-cta-shine" aria-hidden="true" />
              <span className="bh-cta-label">{t("Send message")}</span>
              <span className="bh-cta-arrow contact-send-wa" aria-hidden="true"><WhatsAppIcon size={20} /></span>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
const help: Record<
  string,
  { title: string; intro: string; sections: [string, string][] }
> = {
  shipping: {
    title: "Delivery in Lebanon",
    intro: "Boys & Girlz delivers within Lebanon only.",
    sections: [
      [
        "Shipping within Lebanon",
        "Delivery is available within Lebanon only. It is free on orders over $99, before promo discounts.",
      ],
      [
        "Delivery timing",
        business.deliveryEstimate || "Please contact the shop for the current delivery estimate.",
      ],
      [
        "Your order",
        "Cash on Delivery is available. Delivery charges and order availability are confirmed at checkout.",
      ],
    ],
  },
  returns: {
    title: "Returns and exchanges",
    intro: "Please review the current returns policy before ordering.",
    sections: [
      [
        "Current policy",
        business.returnsPolicy || "The returns policy has not been confirmed yet. Contact the shop before ordering if you need return or exchange details.",
      ],
    ],
  },
  sizing: {
    title: "Just the right little fit.",
    intro: "A simple starting point. Every little one grows differently.",
    sections: [
      [
        "Baby clothing",
        "Available sizes vary by item. Check each product listing and contact us for measurements before ordering.",
      ],
      [
        "For mama",
        "Maternity clothing uses S, M, L, XL and XXL. Ask us for garment measurements to confirm the fit.",
      ],
      [
        "A little note",
        "Measurements depend on the item. Contact us if a product does not yet list the details you need.",
      ],
    ],
  },
};
const helpIcons: LucideIcon[][] = [[Truck, Clock, Banknote], [RotateCcw], [Baby, HandHeart, Info]];
const helpTopics = ["shipping", "returns", "sizing"];
const maternity = ["S", "M", "L", "XL", "XXL"];

// The sizes as a ruler: each step links to the shop filtered to it, the steps fill in as the ruler
// scrolls into view, and the mascot slides along to whichever size is under the pointer.
function SizeRuler({ title, sizes, mascot }: { title: string; sizes: readonly string[]; mascot: "boy" | "girl" }) {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const ruler = ref.current;
    if (!ruler || reduceMotion) return;
    const ctx = gsap.context(() => {
      gsap.from(".ruler-step", { y: 24, opacity: 0, duration: 0.6, ease: "back.out(1.6)", stagger: 0.05, clearProps: "transform,opacity", scrollTrigger: { trigger: ruler, start: "top 85%", once: true } });
      gsap.from(".ruler-fill", { scaleX: 0, duration: 1.4, ease: "power3.inOut", scrollTrigger: { trigger: ruler, start: "top 85%", once: true } });
    }, ruler);
    return () => ctx.revert();
  }, [reduceMotion]);
  return <div className="ruler" ref={ref} style={{ "--count": sizes.length, "--active": active } as CSSProperties}>
    <h2 className="ruler-title">{t(title)}</h2>
    <div className="ruler-track">
      <span className="ruler-line" aria-hidden="true"><span className="ruler-fill" /></span>
      <span className={`home-mascot home-mascot-${mascot} ruler-mascot`} aria-hidden="true" />
      <ol className="ruler-steps">
        {sizes.map((size, index) => <li className="ruler-step" key={size}>
          <Link to={`/shop?size=${encodeURIComponent(size)}`} onPointerEnter={() => setActive(index)} onFocus={() => setActive(index)}>
            <span className="ruler-dot" aria-hidden="true" />
            <span className="ruler-label">{t(size)}</span>
          </Link>
        </li>)}
      </ol>
    </div>
  </div>;
}

// A help topic (delivery, returns or sizing): a springing title over drifting light, the sizes as
// rulers on the sizing page, the topic's notes as cards, then the way to more help.
export function Help() {
  const { t, language } = useLocale();
  const { topic } = useParams();
  const key = helpTopics.includes(topic || "") ? topic! : "shipping";
  const content = help[key];
  const icons = helpIcons[helpTopics.indexOf(key)];
  const cards: PromiseCardItem[] = content.sections.map(([title, body], index) => ({ key: `help-${index}`, Icon: icons[index] || Info, title, body }));
  return (
    <div className="help-v2">
      <section className="contact-hero page-width">
        <div className="about-fields" aria-hidden="true">
          <span className="about-field about-field-pink" />
          <span className="about-field about-field-blue" />
        </div>
        <span className="bh-kicker"><span className="bh-pulse" aria-hidden="true"><Heart size={13} /></span>{t("Here for the little things")}</span>
        <h1 className="contact-title"><SplitTitle text={t(content.title)} byWord={language === "ar"} /></h1>
        <p className="contact-lead">{t(content.intro)}</p>
      </section>

      {key === "sizing" && <section className="rulers page-width">
        <SizeRuler title={content.sections[0][0]} sizes={sizeOptions} mascot="boy" />
        <SizeRuler title={content.sections[1][0]} sizes={maternity} mascot="girl" />
      </section>}

      <section className="help-cards page-width" style={{ "--n": cards.length } as CSSProperties}>
        <PromiseCards items={cards} label={content.title} />
      </section>

      <section className="about-cta">
        <div className="about-fields" aria-hidden="true">
          <span className="about-field about-field-pink" />
          <span className="about-field about-field-blue" />
        </div>
        <Link to="/contact" className="bh-cta" onPointerMove={spotlight}>
          <span className="bh-cta-spot" aria-hidden="true" />
          <span className="bh-cta-shine" aria-hidden="true" />
          <span className="bh-cta-label">{t("A little more help")}</span>
          <span className="bh-cta-arrow" aria-hidden="true"><ArrowRight size={18} /></span>
        </Link>
      </section>
    </div>
  );
}
