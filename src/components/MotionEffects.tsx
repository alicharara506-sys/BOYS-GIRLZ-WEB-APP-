import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "../hooks/useExperience";
gsap.registerPlugin(ScrollTrigger);
export function RouteEffects() {
  const location = useLocation();
  const reduce = useReducedMotion();
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (location.hash) {
        document
          .getElementById(location.hash.slice(1))
          ?.scrollIntoView({ behavior: reduce ? "instant" : "smooth" });
      } else window.scrollTo({ top: 0, behavior: "instant" });
    }, 80);
    return () => clearTimeout(id);
  }, [location.pathname, location.hash, reduce]);
  useEffect(() => {
    if (reduce) return;
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".depth-section, .home-feature-grid, .brand-ribbon, .home-favorites, .home-sale, .home-promise, .home-newsletter, .shop-heading, .product-detail-layout, .reviews-section, .related-section").forEach((el) =>
        gsap.from(el, {
          y: 25,
          scale: 0.985,
          opacity: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 94%", once: true },
        }),
      );
      gsap.utils.toArray<HTMLElement>(".product-card .product-photo").forEach((image) =>
        gsap.from(image, {
          clipPath: "inset(12% 0 0 0 round 12px)",
          opacity: 0.4,
          scale: 1.045,
          duration: 0.85,
          ease: "power2.out",
          scrollTrigger: { trigger: image, start: "top 96%", once: true },
        }),
      );
      gsap.to(".ambient-blob", {
        y: 260,
        scale: 1.4,
        backgroundColor: "#f4b8c1",
        borderRadius: "40% 60% 65% 35%",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });
    });
    return () => context.revert();
  }, [location.pathname, reduce]);
  return (
    <>
      <div className="ambient-blob" aria-hidden="true" />
      {!reduce && <AnimatePresence initial={false}>
        <motion.div
          key={location.pathname}
          className="depth-wipe"
          initial={{ opacity: 0.9, y: 0, clipPath: "inset(0 0 0 0)" }}
          animate={{ opacity: 0, y: -25, clipPath: "inset(0 0 100% 0)" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        ><img src="/assets/boys-girlz-logo.jpg" alt="" /></motion.div>
      </AnimatePresence>}
    </>
  );
}
interface Flight {
  id: number;
  x: number;
  y: number;
  endX: number;
  endY: number;
  image: number;
}
export function FlyToBag() {
  const reduce = useReducedMotion();
  const [flights, setFlights] = useState<Flight[]>([]);
  useEffect(() => {
    if (reduce) return;
    const handle = (event: Event) => {
      const { rect, image } = (event as CustomEvent).detail;
      const end = document.getElementById("cart-icon")?.getBoundingClientRect();
      if (!end) return;
      setFlights((v) => [
        ...v,
        {
          id: performance.now(),
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          endX: end.left + end.width / 2,
          endY: end.top + end.height / 2,
          image,
        },
      ]);
    };
    window.addEventListener("fly-to-bag", handle);
    return () => window.removeEventListener("fly-to-bag", handle);
  }, [reduce]);
  return (
    <AnimatePresence>
      {flights.map((f) => (
        <motion.div
          key={f.id}
          className="fly-item product-photo"
          aria-hidden="true"
          style={{
            backgroundImage: f.image >= 8 ? 'url("/assets/featured-products.png")' : undefined,
            backgroundSize: f.image >= 8 ? "200% 200%" : undefined,
            backgroundPosition: f.image >= 8
              ? `${((f.image - 8) % 2) * 100}% ${Math.floor((f.image - 8) / 2) * 100}%`
              : `${((f.image % 4) * 100) / 3}% ${Math.floor(f.image / 4) * 100}%`,
          }}
          initial={{ left: f.x, top: f.y, scale: 1, rotateY: 0, opacity: 1 }}
          animate={{
            left: [f.x, (f.x + f.endX) / 2, f.endX],
            top: [f.y, Math.min(f.y, f.endY) - 110, f.endY],
            scale: [1, 0.75, 0.1],
            rotateZ: [0, -12, 16],
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.8, times: [0, 0.45, 1], ease: "easeInOut" }}
          onAnimationComplete={() => {
            setFlights((v) => v.filter((i) => i.id !== f.id));
            const bag = document.getElementById("cart-icon");
            bag?.classList.remove("bag-arrived");
            void bag?.offsetWidth;
            bag?.classList.add("bag-arrived");
            window.setTimeout(() => bag?.classList.remove("bag-arrived"), 550);
          }}
        />
      ))}
    </AnimatePresence>
  );
}
