import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Flower2,
  Heart,
  Award,
  Truck,
  Sparkles,
  Star,
} from "lucide-react";
import { products } from "../data/products";
import ProductCard, { ProductImage, Tilt } from "../components/ProductCard";
import Newsletter from "../components/Newsletter";
const cards = [
  { name: "Boys", sub: "For every little adventure", cls: "boys", image: 0 },
  { name: "Girls", sub: "A little lovely, every day", cls: "girls", image: 2 },
  {
    name: "Unisex",
    sub: "Little things, for everyone",
    cls: "unisex",
    image: 1,
  },
  {
    name: "Accessories",
    sub: "The sweetest finishing touches",
    cls: "accessories",
    image: 5,
  },
  { name: "Outlet", sub: "Like New little finds", cls: "outlet", image: 0 },
  { name: "Maternity", sub: "For the glow before the giggle", cls: "maternity", image: 2 },
];
export default function Home() {
  const carousel = useRef<HTMLDivElement>(null);
  return (
    <>
      <section className="hero page-width" aria-labelledby="hero-heading">
        <div className="hero-photo" aria-hidden="true">
          <div className="hero-blob hero-blob-blue" />
          <div className="hero-blob hero-blob-pink" />
          <div className="hero-character hero-character-boys" role="img" aria-label="Boys character from the Boys & Girlz logo" />
          <div className="hero-character hero-character-girls" role="img" aria-label="Girls character from the Boys & Girlz logo" />
        </div>
        <div className="hero-content">
          <span className="eyebrow">
            <Heart size={14} /> Made for little moments
          </span>
          <h1 id="hero-heading">Little clothes,<br /><span>for <b>big</b> <em>smiles.</em></span></h1>
          <p>
            Thoughtfully made clothing for newborns to six-year-olds —
            <br />soft fabrics, honest prices, delivered to every home in Lebanon.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-blue" to="/category/boys">
              Shop boys <ArrowRight size={16} />
            </Link>
            <Link className="btn btn-pink" to="/category/girls">
              Shop girls <ArrowRight size={16} />
            </Link>
          </div>
          <span className="hero-footnote">
            <span>✦</span> For their firsts. And everything after.
          </span>
        </div>
        <Star className="hero-star" size={32} strokeWidth={1.1} aria-hidden="true" />
        <Heart className="hero-heart" size={28} strokeWidth={1.2} aria-hidden="true" />
      </section>
      <div className="page-width trust-row depth-section">
        {[
          {
            Icon: Flower2,
            title: "Soft & safe",
            text: "Gentle on little ones",
            color: "blue",
          },
          {
            Icon: Award,
            title: "Premium quality",
            text: "Thoughtfully chosen",
            color: "blue",
          },
          {
            Icon: Truck,
            title: "Fast delivery",
            text: "From us, with care",
            color: "gold",
          },
          {
            Icon: Heart,
            title: "Made with love",
            text: "For your little treasures",
            color: "gold",
          },
        ].map(({ Icon, title, text, color }) => (
          <div className="trust-item" key={title}>
            <span className={`trust-icon ${color}`}>
              <Icon size={31} strokeWidth={1.3} />
            </span>
            <div>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
          </div>
        ))}
      </div>
      <section
        className="page-width category-section depth-section"
        id="categories"
      >
        <div className="section-heading centered">
          <span className="eyebrow">
            A little something for every little one
          </span>
          <h2>
            <Sparkles size={20} /> Shop by category <Sparkles size={20} />
          </h2>
        </div>
        <div className="category-grid">
          {cards.map((c) => (
            <Tilt className={`category-card ${c.cls}`} key={c.name}>
              <Link to={`/category/${c.name.toLowerCase()}`}>
                <div className="category-art">
                  {c.name === "Boys" || c.name === "Girls" ? (
                    <div
                      className={`category-baby ${c.cls}`}
                      role="img"
                      aria-label={`${c.name} baby clothing collection`}
                    />
                  ) : (
                    <ProductImage
                      product={{
                        image: c.image,
                        name: `${c.name} collection`,
                        model: c.name === "Unisex" ? "romper" : "boots",
                      }}
                    />
                  )}
                </div>
                <div className="category-text">
                  <h3>{c.name}</h3>
                  <p>{c.sub}</p>
                  <span className="category-explore">
                    Explore <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </Tilt>
          ))}
        </div>
        <div className="more-categories">
          <Link to="/category/maternity">
            For mama, too <Heart size={13} />
          </Link>
          <span>·</span>
          <Link to="/category/toys">
            A little playtime <ArrowRight size={13} />
          </Link>
        </div>
      </section>
      <section className="page-width arrivals-section depth-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Fresh little favorites</span>
            <h2>
              New arrivals <span className="handwritten">just landed!</span>
            </h2>
          </div>
          <Link to="/shop?sort=newest" className="text-link">
            View all <ArrowRight size={17} />
          </Link>
        </div>
        <div className="carousel-wrap">
          <button
            className="carousel-arrow prev"
            aria-label="Previous new arrivals"
            onClick={() =>
              carousel.current?.scrollBy({ left: -290, behavior: "smooth" })
            }
          >
            <ChevronLeft size={20} />
          </button>
          <div className="product-carousel" ref={carousel}>
            {products.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <button
            className="carousel-arrow next"
            aria-label="Next new arrivals"
            onClick={() =>
              carousel.current?.scrollBy({ left: 290, behavior: "smooth" })
            }
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </section>
      <section className="page-width sale-banner depth-section">
        <div>
          <span className="eyebrow">Good things come in little packages</span>
          <h2>Little prices. Big cuddles.</h2>
          <p>Up to 25% off selected cozy favorites.</p>
        </div>
        <Link to="/shop?sale=true" className="btn btn-white">
          Find a little treat <ArrowRight size={17} />
        </Link>
        <Star className="sale-star" size={90} strokeWidth={0.8} />
      </section>
      <section className="page-width editorial-section depth-section" aria-labelledby="editorial-heading">
        <div className="editorial-heading">
          <span className="eyebrow">Little moments, beautifully dressed</span>
          <h2 id="editorial-heading">Made for their sweetest beginnings.</h2>
          <p>Soft layers, happy colors, and thoughtful details for every first smile.</p>
        </div>
        <div className="editorial-grid">
          <article className="editorial-card editorial-card-tall">
            <img src="/assets/editorial-pink-baby.jpg" alt="Sleeping baby in a soft pink outfit with matching essentials" loading="lazy" />
            <div><span>Newborn softness</span><h3>Dreamy first layers</h3></div>
          </article>
          <article className="editorial-card">
            <img src="/assets/editorial-lilac-baby.jpg" alt="Smiling baby wearing a lilac bunny outfit" loading="lazy" />
            <div><span>Playful days</span><h3>Colorful little joy</h3></div>
          </article>
          <article className="editorial-card">
            <img src="/assets/editorial-boy-baby.jpg" alt="Happy toddler wearing a navy printed fleece romper" loading="lazy" />
            <div><span>Everyday adventures</span><h3>Ready for cuddles</h3></div>
          </article>
        </div>
      </section>
      <div className="page-width depth-section">
        <Newsletter />
      </div>
    </>
  );
}
