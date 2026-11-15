import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

// Counts smoothly from the last shown number to the new one.
export function useCountUp(value: number, duration = 0.6) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    if (start === value) return;
    const counter = { n: start };
    const tween = gsap.to(counter, { n: value, duration, ease: "power2.out", onUpdate: () => setShown(counter.n) });
    from.current = value;
    return () => { tween.kill(); };
  }, [value, duration]);
  return shown;
}
