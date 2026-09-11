import { useEffect, useState } from "react";
const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export function useReducedMotion() {
  const [value, setValue] = useState(reduced);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setValue(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return value;
}
export function use3D() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(() => {
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    return (
      !reduced() &&
      !(nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) &&
      !(nav.deviceMemory && nav.deviceMemory <= 4) &&
      !nav.connection?.saveData
    );
  });
  return { enabled: enabled && !reduce, setEnabled, reduce };
}
