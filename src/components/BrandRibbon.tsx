const brands = [
  "Carter's", "Old Navy", "Gap", "Little& loved", "Little beginners",
  "Koala baby", "Nicole Miller", "Disney", "Gerber", "Little Me",
  "Nike", "Garanimals", "Cloud Island", "Cat & jack", "Hudson Baby",
  "First Impression", "Baby Essentials", "Baby View", "Kyle & Deena",
  "Sweet & Soft", "Rabbit+Bear", "Eddie Bauer", "Wonder Nation",
  "Tahari", "Chickpea", "Burt's Bees", "DuckDuckGoose", "Calvin Klein",
] as const;

export default function BrandRibbon() {
  return (
    <section className="brand-ribbon page-width" aria-label="Brands carried by Boys & Girlz">
      <span className="brand-ribbon-label">Brands you'll find here</span>
      <div className="brand-ribbon-window">
        <div className="brand-ribbon-track">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1}>
              {brands.map((brand) => <li key={brand}>{brand}</li>)}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
