import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  Heart,
  Mail,
  Check,
  Leaf,
  Truck,
  Instagram,
} from "lucide-react";
import Newsletter from "../components/Newsletter";
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
            Boys & Girlz is a children's merchandising shop in Lebanon offering
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
  const [sent, setSent] = useState(false);
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
          <a href="mailto:support@boysandgirlz.com">
            <Mail size={20} /> support@boysandgirlz.com
          </a>
          <a
            href="https://www.instagram.com/boysandgirlz/"
            target="_blank"
            rel="noreferrer"
          >
            <Instagram size={20} /> @boysandgirlz
          </a>
          <p>
            For sizing, shipping, or a little advice.
            <br />
            Our sample support hours are Monday–Friday, 9am–5pm.
          </p>
          <div className="contact-note">
            <Heart size={25} />
            <p>
              This is a demo storefront. The form gives a local confirmation and
              does not send a message.
            </p>
          </div>
        </div>
        <form
          className="contact-form"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
            e.currentTarget.reset();
          }}
        >
          {sent ? (
            <div className="form-confirmation" role="status">
              <Check size={30} />
              <h2>Your little note is ready.</h2>
              <p>Demo complete — no message was sent.</p>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => setSent(false)}
              >
                Write another note
              </button>
            </div>
          ) : (
            <>
              <label>
                Your name
                <input required name="name" autoComplete="name" />
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
                <textarea required name="message" rows={5} />
              </label>
              <button className="btn btn-pink">
                Submit demo message <ArrowRight size={16} />
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
const help: Record<
  string,
  { title: string; intro: string; sections: [string, string][] }
> = {
  shipping: {
    title: "A little love, delivered.",
    intro: "Shipping information for the Boys & Girlz merchandising shop in Lebanon.",
    sections: [
      [
        "Shipping within Lebanon",
        "Our demo offers delivery within Lebanon only. Delivery is free all over Lebanon on orders over $99, before promo discounts.",
      ],
      [
        "A little patience",
        "The sample delivery window is 5–10 business days. No actual shipments are created by this frontend.",
      ],
      [
        "Your order",
        "A demo confirmation appears at checkout. No shipping or order email is sent.",
      ],
    ],
  },
  returns: {
    title: "A little room to change your mind.",
    intro: "Sample returns and exchanges for the demo store.",
    sections: [
      [
        "30 days of flexibility",
        "Our illustrative return window is 30 days for unworn items with their original packaging. This is sample copy, not an active retail policy.",
      ],
      [
        "Need a different size?",
        "Use the size guide on each product to find a little room to grow. No real exchanges are processed here.",
      ],
      [
        "Here to help",
        "Contact support@boysandgirlz.com when a live store is launched. No purchase or return takes place in this demo.",
      ],
    ],
  },
  sizing: {
    title: "Just the right little fit.",
    intro: "A simple starting point. Every little one grows differently.",
    sections: [
      [
        "Baby clothing",
        "New Born through 5–6 Years. Check each product listing for the exact fit and measurements.",
      ],
      [
        "For mama",
        "S: UK 8–10 · M: UK 12–14 · L: UK 16–18 · XL: UK 20–22. Choose the shape that feels comfortable.",
      ],
      [
        "A little note",
        "All measurements are sample values. Real products should include supplier measurements, garment care, fabric content, and toy age guidance.",
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
