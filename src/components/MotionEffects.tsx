import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "../hooks/useExperience";

gsap.registerPlugin(ScrollTrigger);
// The shop and its categories are one page, so moving between them keeps the scroll and effects.
const pageKey = (pathname: string) => (pathname === "/shop" || pathname.startsWith("/category/") ? "/shop" : pathname);

export function RouteEffects() {
  const location = useLocation();
  const page = pageKey(location.pathname);
  const reduce = useReducedMotion();
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: reduce ? "instant" : "smooth" });
      else window.scrollTo({ top: 0, behavior: "instant" });
    }, 60);
    return () => clearTimeout(id);
  }, [page, location.hash, reduce]);
  useEffect(() => {
    if (reduce) return;
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".shop-heading, .product-detail-layout, .related-section").forEach((element) =>
        gsap.from(element, {
          y: 24, opacity: 0, duration: .65, ease: "power2.out",
          scrollTrigger: { trigger: element, start: "top 94%", once: true },
        }),
      );
      gsap.utils.toArray<HTMLElement>(".product-card .product-photo").forEach((image) =>
        gsap.from(image, {
          clipPath: "inset(8% 0 0 0 round 12px)", opacity: .55,
          duration: .7, ease: "power2.out",
          scrollTrigger: { trigger: image, start: "top 96%", once: true },
        }),
      );
    });
    return () => context.revert();
  }, [page, reduce]);
  return <div key={page} className="route-depth-reveal" aria-hidden="true" />;
}

export function FlyToBag() {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const handle = (event: Event) => {
      const detail = (event as CustomEvent<{ rect: DOMRect; image: number }>).detail;
      const end = document.getElementById("cart-icon")?.getBoundingClientRect();
      if (!detail?.rect || !end) return;
      const startX = detail.rect.left + detail.rect.width / 2;
      const startY = detail.rect.top + detail.rect.height / 2;
      const endX = end.left + end.width / 2;
      const endY = end.top + end.height / 2;
      const item = document.createElement("div");
      item.className = "fly-item product-photo";
      item.setAttribute("aria-hidden", "true");
      item.style.left = `${startX - 36}px`;
      item.style.top = `${startY - 36}px`;
      item.style.width = "72px";
      item.style.height = "72px";
      item.style.backgroundImage = detail.image >= 8 ? 'url("/assets/featured-products.png")' : 'url("/assets/product-contact-sheet.png")';
      item.style.backgroundSize = detail.image >= 8 ? "200% 200%" : "400% 200%";
      item.style.backgroundPosition = detail.image >= 8
        ? `${((detail.image - 8) % 2) * 100}% ${Math.floor((detail.image - 8) / 2) * 100}%`
        : `${((detail.image % 4) * 100) / 3}% ${Math.floor(detail.image / 4) * 100}%`;
      document.body.appendChild(item);
      const animation = item.animate([
        { transform: "translate3d(0,0,0) rotateY(0) scale(1)", opacity: 1, offset: 0 },
        { transform: `translate3d(${(endX - startX) * .52}px,${Math.min(endY, startY) - startY - 90}px,70px) rotateY(160deg) scale(.72)`, opacity: 1, offset: .5 },
        { transform: `translate3d(${endX - startX}px,${endY - startY}px,0) rotateY(320deg) scale(.08)`, opacity: 0, offset: 1 },
      ], { duration: 780, easing: "cubic-bezier(.25,.8,.25,1)" });
      animation.finished.finally(() => {
        item.remove();
        const bag = document.getElementById("cart-icon");
        bag?.classList.add("bag-arrived");
        window.setTimeout(() => bag?.classList.remove("bag-arrived"), 550);
      }).catch(() => item.remove());
    };
    window.addEventListener("fly-to-bag", handle);
    return () => window.removeEventListener("fly-to-bag", handle);
  }, [reduce]);
  return null;
}
