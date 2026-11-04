import { useId, useState, type FormEvent } from "react";
import { Check, LoaderCircle, MapPin } from "lucide-react";
import { Modal } from "./Layout";
import { WhatsAppIcon } from "./SocialIcons";
import { business } from "../config/business";
import type { CartItem } from "../state/storeCore";
import { whatsAppOrderMessage } from "../utils/whatsappOrder";
import { useLocale } from "../i18n/Locale";
import { useCatalog } from "../state/Catalog";

export function whatsAppUrl(message: string) {
  const phone = business.whatsappPhone.replace(/\D/g, "");
  if (!/^[1-9]\d{7,14}$/.test(phone)) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
export default function WhatsAppLink({
  message, className = "", label = "Chat on WhatsApp", ariaLabel, onClick,
}: {
  message: string; className?: string; label?: string; ariaLabel?: string; onClick?: () => void;
}) {
  const { t } = useLocale();
  const url = whatsAppUrl(message);
  if (!url) return null;
  return <a className={className} href={url} target="_blank" rel="noopener noreferrer" aria-label={t(ariaLabel || label)} onClick={onClick}>
    <WhatsAppIcon size={18} /> {t(label)}
  </a>;
}

// A round button in WhatsApp's own green, fixed to the corner, with a slow ring pulsing out of
// it; it turns the brand pink on hover.
export function FloatingWhatsApp() {
  const { language, t } = useLocale();
  const url = whatsAppUrl(language === "ar" ? "مرحباً بويز آند غيرلز! لدي سؤال." : "Hello Boys & Girlz! I have a question.");
  if (!url) return null;
  return <a className="wa-fab" href={url} target="_blank" rel="noopener noreferrer" aria-label={t("Chat with us on WhatsApp")} title={t("Chat with us on WhatsApp")}>
    <span className="wa-fab-ring" aria-hidden="true" />
    <WhatsAppIcon size={28} />
  </a>;
}

// Ordering the bag on WhatsApp: a short step asks for the customer's name and where to deliver
// (their location shared from the phone as a map link, or their area typed in), then opens
// WhatsApp to the shop with the bag, the name and the location written out, ready to send.
export function WhatsAppOrderOption({ cart, onClick }: { cart: CartItem[]; onClick?: () => void }) {
  const { productById } = useCatalog();
  const { language, t } = useLocale();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [spot, setSpot] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState<"" | "busy" | "denied">("");
  const base = whatsAppOrderMessage(cart, language, t, productById);
  if (!base || !whatsAppUrl(base)) return null;

  const locate = () => {
    if (!navigator.geolocation) return setLocating("denied");
    setLocating("busy");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setSpot({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(""); },
      () => setLocating("denied"),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };
  const send = (event: FormEvent) => {
    event.preventDefault();
    const where = spot ? `https://maps.google.com/?q=${spot.lat.toFixed(6)},${spot.lng.toFixed(6)}` : area.trim();
    // The details are now in the message, so drop the line offering to share them later.
    const body = base.replace(" I can share my delivery details in this chat.", "").replace(" يمكنني مشاركة تفاصيل التوصيل في هذه المحادثة.", "");
    const message = [body, "", `${language === "ar" ? "الاسم" : "Name"}: ${name.trim()}`, `${language === "ar" ? "موقع التوصيل" : "Delivery location"}: ${where}`].join("\n");
    const url = whatsAppUrl(message);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
    onClick?.();
  };

  return <div className="whatsapp-order-option">
    <button type="button" className="btn whatsapp-order-button" onClick={() => setOpen(true)}>
      <WhatsAppIcon size={18} /> {t("Order on WhatsApp")}
    </button>
    <p>{t("Opens WhatsApp with your bag. The shop will confirm availability and delivery before your order is placed.")}</p>
    <Modal open={open} onClose={() => setOpen(false)} title={t("Order on WhatsApp")} className="wa-order">
      <form className="wa-order-form" onSubmit={send}>
        <p className="wa-order-lead">{t("Tell us who you are and where to deliver. We'll write it all into the WhatsApp message.")}</p>
        <div className="float-field">
          <input id={`${id}-name`} required minLength={2} autoComplete="name" placeholder=" " value={name} onChange={(e) => setName(e.target.value)} />
          <label htmlFor={`${id}-name`}>{t("Your name")}</label>
        </div>
        <div className="wa-order-where">
          <button type="button" className={`wa-locate ${spot ? "is-done" : ""}`} onClick={locate} disabled={locating === "busy"}>
            <span className="wa-locate-icon" aria-hidden="true">{spot ? <Check size={18} /> : locating === "busy" ? <LoaderCircle size={18} className="spin" /> : <MapPin size={18} />}</span>
            <span>{spot ? t("Location added") : locating === "busy" ? t("Finding you…") : t("Share my location")}</span>
          </button>
          {locating === "denied" && <p className="wa-order-note" role="status">{t("We couldn't get your location. Please type your area below.")}</p>}
          <div className="wa-or"><span>{t("or")}</span></div>
          <div className="float-field">
            <input id={`${id}-area`} required={!spot} autoComplete="street-address" placeholder=" " value={area} onChange={(e) => setArea(e.target.value)} />
            <label htmlFor={`${id}-area`}>{t("Type your area and street")}</label>
          </div>
        </div>
        <button type="submit" className="wa-send"><WhatsAppIcon size={20} /> {t("Send on WhatsApp")}</button>
      </form>
    </Modal>
  </div>;
}
