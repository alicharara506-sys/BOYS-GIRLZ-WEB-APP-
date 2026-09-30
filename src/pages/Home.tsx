import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, Leaf, Shirt, Sun } from "lucide-react";
import { products } from "../data/products";
import ProductCard from "../components/ProductCard";
import Newsletter from "../components/Newsletter";

const featured = products.slice(0, 4);
const filters = ["All", "Boys", "Girls", "Baby"] as const;

function Mascot({ kind }: { kind: "boy" | "girl" }) {
  return <span className={`home-mascot home-mascot-${kind}`} aria-hidden="true" />;
}

export default function Home() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const visibleProducts = featured.filter((product) =>
    filter === "All" ||
    (filter === "Baby" ? product.category === "Unisex" : product.category === filter),
  );

  return (
    <div className="home-page">
      <section className="home-hero page-width" aria-labelledby="hero-heading">
        <div className="home-hero-copy">
          <span className="home-kicker"><Heart size={18} strokeWidth={1.8} aria-hidden="true" /> Made for little moments</span>
          <h1 id="hero-heading">Little clothes,<br /><span className="home-pink">for</span> <span className="home-blue">big</span> <span className="home-pink">smiles.</span></h1>
          <p>Thoughtfully made clothing for newborns to six-year-olds — soft fabrics, honest prices, delivered to every home in Lebanon.</p>
          <div className="home-actions">
            <Link className="home-button home-button-blue" to="/category/boys">Shop boys <ArrowRight size={18} aria-hidden="true" /></Link>
            <Link className="home-button home-button-pink" to="/category/girls">Shop girls <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
        </div>
        <div className="home-hero-art" role="img" aria-label="Smiling blue B boy and pink G girl characters from the Boys & Girlz logo">
          <span className="home-shape home-shape-blue" />
          <span className="home-shape home-shape-pink" />
          <span className="home-doodle home-doodle-blue" aria-hidden="true">✦</span>
          <Heart className="home-doodle-heart" size={42} strokeWidth={2.3} aria-hidden="true" />
          <Mascot kind="boy" />
          <Mascot kind="girl" />
        </div>
      </section>

      <section className="home-feature-grid page-width" aria-label="Shop boys and girls">
        <article className="home-feature home-feature-boys">
          <Mascot kind="boy" />
          <div className="home-feature-copy">
            <h2>Boys</h2>
            <p>Ready, set, play.</p>
            <Link className="home-button home-button-blue" to="/category/boys">Shop Boys <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
          <span className="home-feature-spark" aria-hidden="true">✦</span>
        </article>
        <article className="home-feature home-feature-girls">
          <Mascot kind="girl" />
          <div className="home-feature-copy">
            <h2>Girls</h2>
            <p>Made to shine.</p>
            <Link className="home-button home-button-pink" to="/category/girls">Shop Girls <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
          <Heart className="home-feature-heart" size={27} strokeWidth={2.2} aria-hidden="true" />
        </article>
      </section>

      <section className="home-favorites page-width" aria-labelledby="favorites-heading">
        <div className="home-section-heading">
          <h2 id="favorites-heading">Their next favorites</h2>
          <div className="home-filters" role="group" aria-label="Filter featured products">
            {filters.map((item) => (
              <button key={item} type="button" className={filter === item ? "active" : ""} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>
            ))}
          </div>
          <Link to="/shop?sort=newest" className="home-view-all">View all <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
        <div className="home-product-grid">
          {visibleProducts.map((product) => <ProductCard key={product.id} product={product} showRange />)}
        </div>
      </section>

      <section className="home-promise page-width" aria-label="Why shop with us">
        <div><Leaf size={31} strokeWidth={1.5} aria-hidden="true" /><span><strong>Soft on little skin</strong><small>Gentle, breathable fabrics</small></span></div>
        <div><Sun size={31} strokeWidth={1.5} aria-hidden="true" /><span><strong>Made for everyday play</strong><small>Comfortable and durable</small></span></div>
        <div><Shirt size={31} strokeWidth={1.5} aria-hidden="true" /><span><strong>Easy size guide</strong><small>Find the perfect fit</small></span></div>
      </section>

      <div className="home-newsletter page-width"><Newsletter /></div>
    </div>
  );
}
