import {
  Baby, Backpack, Crown, Footprints, Gem, Gift, Glasses, HandHeart, Heart, Moon, Percent, Recycle,
  Shapes, Shirt, ShoppingBag, Sparkles, Star, Sun, Tag, ToyBrick, type LucideIcon,
} from "lucide-react";

// The icons the owner can pick for a menu entry (see MENU_ICONS in domain/menu.ts).
const icons: Record<string, LucideIcon> = {
  shirt: Shirt, sparkles: Sparkles, baby: Baby, gem: Gem, "hand-heart": HandHeart, "toy-brick": ToyBrick,
  recycle: Recycle, percent: Percent, star: Star, "shopping-bag": ShoppingBag, tag: Tag, heart: Heart,
  gift: Gift, footprints: Footprints, moon: Moon, sun: Sun, crown: Crown, backpack: Backpack,
  glasses: Glasses, shapes: Shapes,
};

export default function MenuIcon({ name, size = 17 }: { name: string; size?: number }) {
  const Icon = icons[name] || Tag;
  return <Icon size={size} />;
}
