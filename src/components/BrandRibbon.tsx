import { useEffect, useRef, type CSSProperties } from "react";
import { approvedBrands } from "../data/brands";
import { useLocale } from "../i18n/Locale";

// How many times each copy repeats the brands, so a copy is always wider than the screen.
const REPEAT = 2;
// Glide speed in pixels per second, kept the same however long the brand list is.
const SPEED = 10;
// Each brand's own wordmark colour, shown on hover, taken from the brand's logo files or
// site where available. Brands whose colour could not be confirmed take the shop's pink
// or blue instead.
export const brandColors: Record<string, string> = {
  "Carter's": "#00a9e0", "Old Navy": "#003764", "Gap": "#002a5f", "Nicole Miller": "#000000",
  "Disney": "#231f20", "Gerber": "#002744", "Little Me": "#7f9c90", "Nike": "#111111",
  "Garanimals": "#0061c8", "Eddie Bauer": "#2f3135", "Burt's Bees": "#564e4c", "Calvin Klein": "#000000",
};
const fallbackColors = ["#fc538e", "#00b3fc"];

// The brands as one endless strip gliding very slowly and fading out at both edges. The
// track holds two identical copies and slides by exactly one, so the loop is seamless. It
// moves toward the reading direction's start and pauses while the pointer rests on it.
export default function BrandRibbon() {
  const { t } = useLocale();
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => {
      const copy = track.firstElementChild as HTMLElement | null;
      if (copy) track.style.setProperty("--brands-duration", `${Math.round(copy.offsetWidth / SPEED)}s`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  const copy = (hidden: boolean) => <ul aria-hidden={hidden || undefined}>
    {Array.from({ length: REPEAT }, (_, round) => approvedBrands.map((brand, index) =>
      <li key={`${round}-${brand}`} aria-hidden={(!hidden && round > 0) || undefined}
        style={{ "--brand": brandColors[brand] ?? fallbackColors[index % 2] } as CSSProperties}>{brand}</li>))}
  </ul>;

  return (
    <section className="brands" aria-labelledby="brands-title">
      <div className="section-eyebrow">
        <span aria-hidden="true" />
        <h2 id="brands-title" className="section-eyebrow-text">{t("Brands you'll find here")}</h2>
        <span aria-hidden="true" />
      </div>
      <div className="brands-window">
        <div className="brands-track" ref={trackRef}>
          {copy(false)}
          {copy(true)}
        </div>
      </div>
    </section>
  );
}
