import { Facebook, Instagram } from "lucide-react";
import { business } from "../config/business";

// TikTok's note mark, drawn to match the line icons used elsewhere.
export function TikTokIcon({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
    <path d="M14 3c.4 2.6 2.2 4.4 5 4.6" />
  </svg>;
}

// WhatsApp's chat bubble with the phone inside.
export function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.6a9.4 9.4 0 0 0-8.1 14.2L2.6 21.4l4.7-1.2A9.4 9.4 0 1 0 12 2.6z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    <path fill="currentColor" d="M8.9 7.5c.2-.4.5-.4.7-.4h.6c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .6l-.4.6c-.1.2-.2.3-.1.5.6 1.1 1.5 2 2.6 2.6.2.1.4.1.5-.1l.6-.7c.2-.2.4-.2.6-.1l1.8.9c.2.1.4.2.4.4 0 .7-.3 1.4-.9 1.8-.6.4-1.4.5-2.2.3-2.6-.8-4.7-2.8-5.6-5.4-.3-.8-.2-1.7.2-2.4z" />
  </svg>;
}

// The shop's social accounts, each with its own colour.
export const socials = [
  { name: "Instagram", handle: "@boysandgirlz.lb", href: business.instagram, Icon: Instagram, tint: "#e1306c" },
  { name: "Facebook", handle: "Boysandgirlz", href: business.facebook, Icon: Facebook, tint: "#1877f2" },
  { name: "TikTok", handle: "@boysandgirlz.lb", href: business.tiktok, Icon: TikTokIcon, tint: "#1f2633" },
];
