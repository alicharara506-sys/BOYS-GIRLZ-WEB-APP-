import { useState } from "react";
import { ArrowRight, Check, Heart } from "lucide-react";
import { useStore } from "../state/Store";
export default function Newsletter({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const { notify } = useStore();
  return (
    <section
      className={`newsletter ${compact ? "compact" : ""}`}
      aria-label="Newsletter"
    >
      {!compact && (
        <div className="newsletter-copy">
          <span className="newsletter-heart">
            <Heart size={35} strokeWidth={1.2} />
          </span>
          <div>
            <h2>
              Join our family <Heart size={17} fill="currentColor" />
            </h2>
            <p>Little updates, new arrivals & a little extra love.</p>
          </div>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setJoined(true);
          notify("You’re on the list! Newsletter signup saved for this demo.");
          setEmail("");
        }}
      >
        <label
          className="sr-only"
          htmlFor={compact ? "footer-email" : "newsletter-email"}
        >
          Email address for newsletter
        </label>
        <input
          id={compact ? "footer-email" : "newsletter-email"}
          type="email"
          required
          placeholder={joined ? "Thank you for joining!" : "Your email address"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn btn-pink" type="submit">
          {joined ? (
            <>
              <Check size={16} /> Joined
            </>
          ) : (
            <>
              Subscribe <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </section>
  );
}
