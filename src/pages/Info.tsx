import { Link, useFetcher, useParams } from "react-router-dom";
import {
  ArrowRight,
  Heart,
  Phone,
  Check,
  Leaf,
  Truck,
  Instagram,
} from "lucide-react";
import Newsletter from "../components/Newsletter";
import { business } from "../config/business";
import WhatsAppLink from "../components/WhatsAppLink";
export function About() {
  return (
    <div className="page-width">
      <section className="story-layout">
        <div>
          <span className="eyebrow">A little about us</span>
          <h1>
            For their firsts.
            <br />
            <span>And everything after.</span>
          </h1>
          <p>
            First smiles. First steps. The first time they insist on dressing
            themselves.
          </p>
          <p>
            Boys & Girlz is a children's clothing shop in Lebanon offering
            kids clothes, toys, accessories, maternity pieces, and Like New
            outlet finds for growing families.
          </p>
          <p>
            <strong>What is Boys & Girlz?</strong> We are an online baby shop
            in Lebanon and a family-friendly retail destination where comfort,
            practical value, and cheerful design come first.
          </p>
          <p><strong>Where do you ship?</strong> We ship within Lebanon only. Every order is prepared locally with care.</p>
          <Link to="/shop" className="btn btn-blue">
            Meet your next favorite <ArrowRight size={16} />
          </Link>
        </div>
        <div
          className="story-image"
          role="img"
          aria-label="Happy babies in soft blue and pink outfits"
        />
      </section>
      <div className="story-values">
        {[
          [Heart, "Chosen with love", "Thoughtful details for the everyday."],
          [
            Leaf,
            "Comfort comes first",
            "Softness for their little adventures.",
          ],
          [Truck, "A little closer", "Lovely things, delivered to your door."],
        ].map(([Icon, title, text]) => {
          const I = Icon as typeof Heart;
          return (
            <div key={String(title)}>
              <I size={30} strokeWidth={1.2} />
              <h2>{String(title)}</h2>
              <p>{String(text)}</p>
            </div>
          );
        })}
      </div>
      <Newsletter />
    </div>
  );
}
export function Contact() {
  const fetcher = useFetcher<{ success?: boolean; error?: string }>();
  return (
    <div className="page-width">
      <div className="page-heading">
        <span className="eyebrow">We’re all ears</span>
        <h1>A little hello goes a long way.</h1>
        <p>Questions about a little favorite? We’re here to help.</p>
      </div>
      <div className="contact-layout">
        <div>
          <h2>Let’s talk.</h2>
          {business.phone && <a href={`tel:${business.phone}`}><Phone size={20} /> {business.phone}</a>}
          <WhatsAppLink message="Hello Boys & Girlz, I have a question about an item." />
          <a
            href="https://www.instagram.com/boysandgirlz/"
            target="_blank"
            rel="noreferrer"
          >
            <Instagram size={20} /> @boysandgirlz
          </a>
          {business.address && <p>Visit us: {business.address} · <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`} target="_blank" rel="noopener noreferrer">View map</a></p>}
          {business.hours && <p>Opening hours: {business.hours}</p>}
          <p>For sizing, delivery, or a little advice, send a note below.</p>
        </div>
        <fetcher.Form className="contact-form" method="post">
          {fetcher.data?.success ? (
            <div className="form-confirmation" role="status">
              <Check size={30} />
              <h2>We received your note.</h2>
              <p>Thank you for getting in touch.</p>
            </div>
          ) : (
            <>
              <label>
                Your name
                <input required name="fullName" autoComplete="name" minLength={2} />
              </label>
              <label>
                Email address
                <input
                  required
                  type="email"
                  name="email"
                  autoComplete="email"
                />
              </label>
              <label>
                Your little note
                <textarea required name="message" rows={5} minLength={10} />
              </label>
              <div className="sr-only" aria-hidden="true"><label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label></div>
              {fetcher.data?.error && <p className="form-error" role="alert">{fetcher.data.error}</p>}
              <button className="btn btn-pink" disabled={fetcher.state !== "idle"}>
                {fetcher.state !== "idle" ? "Sending…" : "Send message"} <ArrowRight size={16} />
              </button>
            </>
          )}
        </fetcher.Form>
      </div>
    </div>
  );
}
const help: Record<
  string,
  { title: string; intro: string; sections: [string, string][] }
> = {
  shipping: {
    title: "Delivery in Lebanon",
    intro: "Boys & Girlz delivers within Lebanon only.",
    sections: [
      [
        "Shipping within Lebanon",
        "Delivery is available within Lebanon only. It is free on orders over $99, before promo discounts.",
      ],
      [
        "Delivery timing",
        business.deliveryEstimate || "Please contact the shop for the current delivery estimate.",
      ],
      [
        "Your order",
        "Cash on Delivery is available. Delivery charges and order availability are confirmed at checkout.",
      ],
    ],
  },
  returns: {
    title: "Returns and exchanges",
    intro: "Please review the current returns policy before ordering.",
    sections: [
      [
        "Current policy",
        business.returnsPolicy || "The returns policy has not been confirmed yet. Contact the shop before ordering if you need return or exchange details.",
      ],
    ],
  },
  sizing: {
    title: "Just the right little fit.",
    intro: "A simple starting point. Every little one grows differently.",
    sections: [
      [
        "Baby clothing",
        "Available sizes vary by item. Check each product listing and contact us for measurements before ordering.",
      ],
      [
        "For mama",
        "Maternity clothing uses S, M, L, XL and XXL. Ask us for garment measurements to confirm the fit.",
      ],
      [
        "A little note",
        "Measurements depend on the item. Contact us if a product does not yet list the details you need.",
      ],
    ],
  },
};
export function Help() {
  const { topic } = useParams();
  const content = help[topic || ""] || help.shipping;
  return (
    <div className="page-width help-page">
      <div className="page-heading">
        <span className="eyebrow">Here for the little things</span>
        <h1>{content.title}</h1>
        <p>{content.intro}</p>
      </div>
      {content.sections.map(([h, p]) => (
        <section key={h}>
          <h2>{h}</h2>
          <p>{p}</p>
        </section>
      ))}
      <Link to="/contact" className="btn btn-blue">
        A little more help <ArrowRight size={16} />
      </Link>
    </div>
  );
}
