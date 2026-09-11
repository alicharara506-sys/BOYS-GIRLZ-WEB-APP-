import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Box, Pause } from "lucide-react";
import { use3D } from "../hooks/useExperience";
import SceneBoundary from "./SceneBoundary";
const HeroScene = lazy(() => import("../scenes/HeroScene"));
export default function HeroExperience() {
  const { enabled, setEnabled, reduce } = use3D();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.02 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      cancelAnimationFrame(id);
      observer.disconnect();
    };
  }, []);
  return (
    <>
      <div className="hero-canvas" ref={ref} aria-hidden="true">
        {mounted && enabled && (
          <SceneBoundary fallback={null}>
            <Suspense fallback={null}>
              <HeroScene active={active} />
            </Suspense>
          </SceneBoundary>
        )}
      </div>
      {reduce ? (
        <span className="scene-toggle calm-label">Calm mode</span>
      ) : (
        <button
          className="scene-toggle"
          onClick={() => setEnabled(!enabled)}
          aria-pressed={enabled}
          aria-label={
            enabled ? "Pause 3D hero animation" : "Enable 3D hero animation"
          }
        >
          {enabled ? (
            <>
              <Pause size={11} /> A little 3D magic
            </>
          ) : (
            <>
              <Box size={12} /> Turn on 3D magic
            </>
          )}
        </button>
      )}
    </>
  );
}
