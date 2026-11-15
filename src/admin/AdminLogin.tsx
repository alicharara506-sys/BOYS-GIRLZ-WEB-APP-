import { Form, Link, useActionData, useNavigation } from "react-router";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import "./admin.css";
function Token({ value, intent }: { value: string; intent: string }) {
  return (
    <>
      <input name="csrfToken" type="hidden" value={value} />
      <input type="hidden" name="intent" value={intent} />
    </>
  );
}
type ActionResult = { error?: string };
export function AdminLogin({
  csrfToken,
  configured,
  error,
  localEmail,
}: {
  csrfToken: string;
  configured: boolean;
  error?: string;
  localEmail?: string;
}) {
  const action = useActionData<ActionResult>();
  const busy = useNavigation().state !== "idle";
  return (
    <div className="bg-admin bg-admin-login">
      <div className="bg-admin-login-art">
        <Link to="/" className="bg-admin-login-logo">
          <img
            src="/assets/boys-girlz-logo.webp"
            alt="Boys & Girlz"
            width="230"
            height="77"
          />
        </Link>
        <div>
          <span className="bg-admin-kicker">
            A LITTLE CARE. A LOT OF POSSIBILITY.
          </span>
          <h2>
            Your little store.
            <br />
            Big possibilities.
          </h2>
          <p>
            A thoughtful space to look after your collection, your orders, and
            the families who shop with you.
          </p>
          <span className="bg-admin-login-mascots" aria-hidden="true">
            <img
              src="/assets/brand-characters.webp"
              alt=""
              width="500"
              height="250"
            />
          </span>
        </div>
        <span className="bg-admin-login-art-footer">
          Made for little moments.
        </span>
      </div>
      <main className="bg-admin-login-main">
        <div className="bg-admin-login-card">
          <span className="bg-admin-login-shield">
            <ShieldCheck size={28} strokeWidth={1.5} />
          </span>
          <span className="bg-admin-kicker">STORE ADMINISTRATION</span>
          <h1>Welcome back.</h1>
          <p>Sign in to look after your Boys & Girlz store.</p>
          {(error || action?.error) && (
            <div role="alert" className="bg-admin-feedback is-error">
              {error || action?.error}
            </div>
          )}
          {configured ? (
            <Form method="post">
              <Token value={csrfToken} intent="login" />
              <label>
                Email address
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="username"
                  defaultValue={localEmail}
                  placeholder="you@example.com"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                />
              </label>
              <button type="submit" className="bg-admin-button" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
                <ArrowRight size={18} />
              </button>
            </Form>
          ) : (
            <div className="bg-admin-login-setup">
              <h3>Your admin account is not set up yet.</h3>
              <p>
                Complete the local admin setup to create your private sign-in
                details.
              </p>
            </div>
          )}
          <Link className="bg-admin-back" to="/">
            <ArrowLeft size={15} />
            Back to the storefront
          </Link>
        </div>
        <p className="bg-admin-login-note">
          <ShieldCheck size={14} />
          Private access for store administrators.
        </p>
      </main>
    </div>
  );
}
