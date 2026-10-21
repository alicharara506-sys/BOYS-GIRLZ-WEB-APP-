import { approvedBrands } from "../data/brands";
import { useLocale } from "../i18n/Locale";

export default function BrandRibbon() {
  const { t } = useLocale();
  return (
    <section className="brand-ribbon page-width" aria-label={t("Brands carried by Boys & Girlz")}>
      <span className="brand-ribbon-label">{t("Brands you'll find here")}</span>
      <div className="brand-ribbon-window" tabIndex={0}>
        <div className="brand-ribbon-track">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1}>
              {approvedBrands.map((brand) => <li key={brand}>{brand}</li>)}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
