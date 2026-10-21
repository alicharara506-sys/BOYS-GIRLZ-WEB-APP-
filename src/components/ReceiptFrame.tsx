import { useEffect, useRef, type ReactNode } from "react";
import { Heart, Star } from "lucide-react";

export default function ReceiptFrame({ children, className = "", label, active = true }: {
  children: ReactNode;
  className?: string;
  label?: string;
  active?: boolean;
}) {
  const frame = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = frame.current;
    const feed = element?.querySelector<HTMLElement>(".receipt-feed");
    const paper = element?.querySelector<HTMLElement>(".receipt-paper");
    if (!element || !feed || !paper) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animations: Animation[] = [];
    let disposed = false;
    const finish = () => {
      animations.forEach((animation) => animation.finish());
      element.dataset.receiptState = "ready";
    };
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      if (reduced.matches) { finish(); return; }
      element.dataset.receiptState = "printing";
      // Reveal the logo first, then advance the receipt in short motor-fed bursts.
      // Its full layout space stays reserved so totals and neighbouring cards never jump.
      const timing = { duration: 2400, fill: "forwards" as const };
      animations = [
        feed.animate([
          { clipPath: "inset(0 0 100% 0)", offset: 0 },
          { clipPath: "inset(0 0 100% 0)", offset: .08 },
          { clipPath: "inset(0 0 76% 0)", offset: .28, easing: "steps(12, end)" },
          { clipPath: "inset(0 0 76% 0)", offset: .34 },
          { clipPath: "inset(0 0 41% 0)", offset: .60, easing: "steps(18, end)" },
          { clipPath: "inset(0 0 41% 0)", offset: .66 },
          { clipPath: "inset(0 0 0% 0)", offset: .96 },
          { clipPath: "inset(0 0 0% 0)", offset: 1 },
        ], timing),
        paper.animate([
          { transform: "translateY(-18px)" },
          { transform: "translateY(-12px)", offset: .32 },
          { transform: "translateY(-7px)", offset: .64 },
          { transform: "translateY(0)" },
        ], { ...timing, easing: "steps(24, end)" }),
      ];
      Promise.all(animations.map((animation) => animation.finished)).then(() => {
        if (!disposed) element.dataset.receiptState = "ready";
      }).catch(() => { /* Closing the drawer cancels the current print cycle. */ });
    }, { threshold: .05 });
    element.dataset.receiptState = active && !reduced.matches ? "waiting" : "ready";
    if (active) observer.observe(element);
    // A tap or keyboard focus immediately exposes every control, including totals below it.
    element.addEventListener("pointerdown", finish);
    element.addEventListener("focusin", finish);
    reduced.addEventListener("change", finish);
    window.addEventListener("beforeprint", finish);
    return () => {
      disposed = true;
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
      element.removeEventListener("pointerdown", finish);
      element.removeEventListener("focusin", finish);
      reduced.removeEventListener("change", finish);
      window.removeEventListener("beforeprint", finish);
    };
  }, [active]);
  return <section ref={frame} className={`receipt-frame ${className}`} aria-label={label}>
    <div className="receipt-printer" aria-hidden="true">
      <div className="receipt-printer-panel"><Heart /><span /><Star /></div>
      <div className="receipt-printer-slot" />
    </div>
    <div className="receipt-feed"><div className="receipt-paper">
      <div className="receipt-brand">
        <Star aria-hidden="true" />
        <img src="/assets/boys-girlz-logo.jpg" alt="Boys & Girlz" width={1600} height={800} />
        <Heart aria-hidden="true" />
      </div>
      {children}
      <div className="receipt-signoff" aria-hidden="true"><Star /><Heart /><Star /></div>
      <div className="receipt-paper-edge" aria-hidden="true" />
    </div></div>
  </section>;
}
