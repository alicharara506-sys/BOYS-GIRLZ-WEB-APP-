import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, HelpCircle, LayoutGrid, Tag, Truck } from "lucide-react";
import { whatsAppUrl } from "./WhatsAppLink";
import { socials, WhatsAppIcon } from "./SocialIcons";
import { approvedBrands, brandSlug } from "../data/brands";
import { categories, matchesCategory, products } from "../data/products";
import { useLocale } from "../i18n/Locale";
import { brandColors } from "./BrandRibbon";
import Newsletter from "./Newsletter";

const FOOTER_BRANDS = 6;
const categoryCounts = Object.fromEntries(categories.map((category) => [category, products.filter((product) => matchesCategory(product, category)).length]));

// A list of footer links with a glass highlight that glides to whichever link is under the
// pointer or has keyboard focus.
function FooterLinkList({ children }: { children: ReactNode }) {
  const pill = useRef<HTMLSpanElement>(null);
  const moveTo = (target: EventTarget | null) => {
    const link = target instanceof Element ? target.closest("a") : null;
    const el = pill.current;
    if (!link || !el) return;
    el.style.setProperty("--pill-y", `${link.offsetTop}px`);
    el.style.setProperty("--pill-h", `${link.offsetHeight}px`);
    el.classList.add("is-visible");
  };
  const hide = () => pill.current?.classList.remove("is-visible");
  return <ul className="footer-links" onPointerOver={(event) => moveTo(event.target)} onFocus={(event) => moveTo(event.target)} onPointerLeave={hide} onBlur={hide}>
    <span className="footer-links-pill" ref={pill} aria-hidden="true" />
    {children}
  </ul>;
}

function FooterLink({ to, children, detail }: { to: string; children: ReactNode; detail?: ReactNode }) {
  return <li>
    <Link to={to}>
      <span className="footer-link-label">{children}</span>
      {detail}
      <ArrowRight className="footer-link-arrow" size={14} aria-hidden="true" />
    </Link>
  </li>;
}

// One of the footer's panels: a glass card whose surface and border light up where the pointer is.
function FooterPanel({ title, icon, count, children }: { title: string; icon: ReactNode; count?: number; children: ReactNode }) {
  const torch = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--x", `${event.clientX - box.left}px`);
    event.currentTarget.style.setProperty("--y", `${event.clientY - box.top}px`);
  };
  return <div className="footer-panel" onPointerMove={torch}>
    <h2>
      <span className="footer-panel-icon" aria-hidden="true">{icon}</span>
      <span className="footer-panel-title">{title}</span>
      {count !== undefined && <span className="footer-panel-count">{count}</span>}
    </h2>
    {children}
  </div>;
}

// A way to reach the shop, with its icon on a small glass tile that turns white on hover.
function ContactRow({ icon, label, children, href }: { icon: ReactNode; label: string; children: ReactNode; href?: string }) {
  const body = <>
    <span className="footer-contact-icon" aria-hidden="true">{icon}</span>
    <span className="footer-contact-copy"><small>{label}</small><span>{children}</span></span>
  </>;
  return href
    ? <a className="footer-contact" href={href} target="_blank" rel="noreferrer">{body}</a>
    : <div className="footer-contact">{body}</div>;
}

// The site footer, set apart from the light page on a deep ink: a light travelling along its
// top edge, soft pink and blue glows drifting behind it, the brand, the newsletter and every
// way to reach the shop on one side, its categories, brands and help pages on the other, then
// the copyright line.
export default function Footer() {
  const { t, language } = useLocale();
  const whatsapp = whatsAppUrl(language === "ar" ? "مرحباً بويز آند غيرلز! لدي سؤال عن المتجر." : "Hello Boys & Girlz! I have a question about your shop.");
  return <footer className="site-footer-v2">
    <div className="footer-beam" aria-hidden="true"><span /></div>
    <div className="footer-glows" aria-hidden="true">
      <span className="footer-glow footer-glow-top" />
      <span className="footer-glow footer-glow-pink" />
      <span className="footer-glow footer-glow-blue" />
      <span className="footer-dots" />
    </div>

    <div className="footer-inner page-width">
      <div className="footer-grid">
        <div className="footer-brand">
          <Link to="/" className="footer-logo" aria-label="Boys and Girlz home">
            <img src="/assets/boys-girlz-logo-on-dark.webp" alt="Boys & Girlz" width="480" height="161" />
          </Link>
          <p>{t("A children's shop in Lebanon")}</p>
          <div className="footer-signup">
            <h2>{t("Join our little circle")}</h2>
            <p>{t("Be the first to know about new arrivals, special offers and more.")}</p>
            <Newsletter compact />
          </div>
          <div className="footer-contacts">
            {socials.map(({ name, handle, href, Icon }) => <ContactRow key={name} icon={<Icon size={16} />} label={name} href={href}>
              <span dir="ltr">{handle}</span>
            </ContactRow>)}
            {whatsapp && <ContactRow icon={<WhatsAppIcon size={16} />} label="WhatsApp" href={whatsapp}><span dir="ltr">+961 81 061 731</span></ContactRow>}
          </div>
        </div>

        <div className="footer-panels">
          <FooterPanel title={t("Shop")} icon={<LayoutGrid size={14} />} count={products.length}>
            <FooterLinkList>
              {categories.map((category) => <FooterLink key={category} to={`/category/${category.toLowerCase()}`}
                detail={<span className="footer-link-count">{categoryCounts[category]}</span>}>{t(category)}</FooterLink>)}
              <FooterLink to="/shop"><strong>{t("Shop all")}</strong></FooterLink>
            </FooterLinkList>
          </FooterPanel>

          <FooterPanel title={t("Brands")} icon={<Tag size={14} />} count={approvedBrands.length}>
            <ul className="footer-brands">
              {approvedBrands.slice(0, FOOTER_BRANDS).map((brand) => <li key={brand}>
                <Link to={`/shop?brand=${brandSlug(brand)}`} style={{ "--brand": brandColors[brand] ?? "#fc538e" } as CSSProperties}>{brand}</Link>
              </li>)}
            </ul>
          </FooterPanel>

          <FooterPanel title={t("Help")} icon={<HelpCircle size={14} />}>
            <FooterLinkList>
              <FooterLink to="/about">{t("About Us")}</FooterLink>
              <FooterLink to="/help/sizing">{t("Size Guide")}</FooterLink>
              <FooterLink to="/faq">{t("Help & FAQs")}</FooterLink>
              <FooterLink to="/contact">{t("Contact")}</FooterLink>
            </FooterLinkList>
          </FooterPanel>
        </div>
      </div>
    </div>

    <div className="footer-bottom-v2">
      <div className="page-width">
        <span>© {new Date().getFullYear()} Boys & Girlz · {t("A children's shop in Lebanon")}</span>
        <span><Truck size={14} aria-hidden="true" /> {t("Delivery within Lebanon only")} · <Link to="/contact">{t("Contact us")}</Link></span>
      </div>
    </div>
  </footer>;
}
