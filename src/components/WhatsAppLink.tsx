import { MessageCircle } from "lucide-react";
import { business } from "../config/business";

export function whatsAppUrl(message: string) {
  const phone = business.whatsappPhone.replace(/\D/g, "");
  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
export default function WhatsAppLink({ message, className = "" }: { message: string; className?: string }) {
  const url = whatsAppUrl(message);
  if (!url) return null;
  return <a className={className} href={url} target="_blank" rel="noopener noreferrer" aria-label="Contact Boys & Girlz on WhatsApp">
    <MessageCircle size={18} aria-hidden="true" /> WhatsApp
  </a>;
}
