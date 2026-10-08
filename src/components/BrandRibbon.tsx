import { approvedBrands } from "../data/brands";

export default function BrandRibbon() {
  return (
    <section className="brand-ribbon page-width" aria-label="Brands carried by Boys & Girlz">
      <span className="brand-ribbon-label">Brands you'll find here</span>
      <div className="brand-ribbon-window">
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
