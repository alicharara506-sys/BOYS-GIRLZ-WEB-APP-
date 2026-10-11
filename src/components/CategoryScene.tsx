import type { Category } from "../data/products";
import { useLocale } from "../i18n/Locale";
export default function CategoryScene({ category }: { category: Category }) {
  const { t } = useLocale();
  const boy = category === "Boys";
  const girl = category === "Girls";
  return <div className={`category-scene category-scene-${category.toLowerCase()}`} role="img" aria-label={t(boy ? "Original Boys & Girlz blue B character" : girl ? "Original Boys & Girlz pink G character" : "Original Boys & Girlz B and G characters")}>
    <span className="category-scene-blob category-scene-blob-blue" aria-hidden="true" />
    <span className="category-scene-blob category-scene-blob-pink" aria-hidden="true" />
    {!girl && <span className="home-mascot home-mascot-boy" aria-hidden="true" />}
    {!boy && <span className="home-mascot home-mascot-girl" aria-hidden="true" />}
  </div>;
}
