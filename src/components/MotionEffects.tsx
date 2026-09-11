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
      gsap.utils.toArray<HTMLElement>(".depth-section").forEach((el) =>
        gsap.from(el, {
          y: 24,
          scale: 0.975,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 95%", once: true },
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
      {!reduce && (
        <motion.div
          key={location.pathname}
          className="depth-wipe"
          initial={{ opacity: 0.65, scale: 1.05, rotateX: 7 }}
          animate={{ opacity: 0, scale: 1, rotateX: 0 }}
          transition={{ duration: 0.48, ease: "easeOut" }}
          aria-hidden="true"
        />
      )}
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
            backgroundPosition: `${((f.image % 4) * 100) / 3}% ${Math.floor(f.image / 4) * 100}%`,
          }}
          initial={{ left: f.x, top: f.y, scale: 1, rotateY: 0, opacity: 1 }}
          animate={{
            left: [f.x, (f.x + f.endX) / 2, f.endX],
            top: [f.y, Math.min(f.y, f.endY) - 110, f.endY],
            scale: [1, 0.75, 0.1],
            rotateY: [0, 90, 180],
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.8, times: [0, 0.45, 1], ease: "easeInOut" }}
          onAnimationComplete={() =>
            setFlights((v) => v.filter((i) => i.id !== f.id))
          }
        />
      ))}
    </AnimatePresence>
  );
}
