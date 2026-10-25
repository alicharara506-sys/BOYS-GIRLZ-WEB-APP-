import { useState } from "react";
import type { Category } from "../data/products";
import { useLocale } from "../i18n/Locale";

// The category's characters at play, with nothing behind them: both on a seesaw, tipping up and
// down in turn and pushing off as they land; or, for the boys' or girls' page, one on a swing
// arcing back and forth. A click gives the ride an extra-big push.
export default function CategoryScene({ category }: { category: Category }) {
  const { t } = useLocale();
  const [push, setPush] = useState(0);
  const boy = category === "Boys";
  const girl = category === "Girls";
  const label = t(boy ? "Original Boys & Girlz blue B character" : girl ? "Original Boys & Girlz pink G character" : "Original Boys & Girlz B and G characters");

  if (boy || girl) {
    const kid = boy ? "boy" : "girl";
    return <div className={`category-scene play-swing play-swing-${kid}`} role="img" aria-label={label} onClick={() => setPush((n) => n + 1)} data-push={push % 2}>
      <span className="swing-shadow" aria-hidden="true" />
      <span className="swing-arm" aria-hidden="true" key={push}>
        <span className="swing-rope swing-rope-a" />
        <span className="swing-rope swing-rope-b" />
        <span className="swing-seat" />
        <span className="swing-kid"><span className={`home-mascot home-mascot-${kid}`} /></span>
      </span>
    </div>;
  }

  return <div className="category-scene play-seesaw" role="img" aria-label={label} onClick={() => setPush((n) => n + 1)}>
    <span className="seesaw-shadow" aria-hidden="true" />
    <span className="seesaw-pivot" aria-hidden="true" />
    <span className="seesaw-plank" aria-hidden="true" key={push} data-push={push ? "1" : undefined}>
      <span className="seesaw-end seesaw-end-boy"><span className="seesaw-kid"><span className="home-mascot home-mascot-boy" /></span></span>
      <span className="seesaw-end seesaw-end-girl"><span className="seesaw-kid"><span className="home-mascot home-mascot-girl" /></span></span>
    </span>
  </div>;
}
