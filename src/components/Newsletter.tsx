import { useFetcher } from "react-router";
import { ArrowRight, Check, Mail } from "lucide-react";
import { useLocale } from "../i18n/Locale";
export default function Newsletter({ compact = false }: { compact?: boolean }) {
  const { t } = useLocale();
  const fetcher = useFetcher<{ success?: boolean; error?: string }>();
  const joined = Boolean(fetcher.data?.success);
  return (
    <section
      className={`newsletter ${compact ? "compact" : ""}`}
      aria-label={t("Newsletter")}
    >
      {!compact && (
        <div className="newsletter-copy">
          <span className="newsletter-heart">
            <Mail size={33} strokeWidth={1.5} />
          </span>
          <div>
            <h2>{t("Join our little circle")}</h2>
            <p>{t("Be the first to know about new arrivals, special offers and more.")}</p>
          </div>
        </div>
      )}
      <fetcher.Form method="post" action="/newsletter">
        <label
          className="sr-only"
          htmlFor={compact ? "footer-email" : "newsletter-email"}
        >
          {t("Email address for newsletter")}
        </label>
        <input
          id={compact ? "footer-email" : "newsletter-email"}
          type="email"
          autoComplete="email"
          name="email"
          required
          placeholder={t(joined ? "Thank you for joining!" : "Your email address")}
          disabled={joined}
        />
        <input name="website" className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <button className="btn btn-pink" type="submit" disabled={joined || fetcher.state !== "idle"}>
          {joined ? (
            <>
              <Check size={16} /> {t("Joined")}
            </>
          ) : (
            <>
              {t("Subscribe")} <ArrowRight size={16} />
            </>
          )}
        </button>
        {fetcher.data?.error && <p className="form-error" role="alert">{t(fetcher.data.error)}</p>}
      </fetcher.Form>
    </section>
  );
}
