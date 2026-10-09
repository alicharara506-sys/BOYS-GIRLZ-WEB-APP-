import { MessageCircle } from "lucide-react";
import { business } from "../config/business";
import type { CartItem } from "../state/storeCore";
import { whatsAppOrderMessage } from "../utils/whatsappOrder";

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
  const url = whatsAppUrl(message);
  if (!url) return null;
  return <a className={className} href={url} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel || label} onClick={onClick}>
    <MessageCircle size={18} aria-hidden="true" /> {label}
  </a>;
}

export function WhatsAppOrderOption({ cart, onClick }: { cart: CartItem[]; onClick?: () => void }) {
  const message = whatsAppOrderMessage(cart);
  if (!message || !whatsAppUrl(message)) return null;
  return <div className="whatsapp-order-option">
    <WhatsAppLink
      className="btn whatsapp-order-button"
      message={message}
      label="Request order on WhatsApp"
      ariaLabel="Send your bag to Boys & Girlz on WhatsApp"
      onClick={onClick}
    />
    <p>Opens WhatsApp with your bag. The shop will confirm availability and delivery before your order is placed.</p>
  </div>;
}
