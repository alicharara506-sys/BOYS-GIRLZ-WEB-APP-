import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type FormEvent,
} from "react";
import { useFetcher } from "react-router";
import { LoaderCircle, X } from "lucide-react";
export const TokenContext = createContext("");
export const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n / 100,
  );
export const date = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export const amount = (v: FormDataEntryValue | null) =>
  Math.round(Number(v || 0) * 100);
export const str = (f: FormData, k: string) => String(f.get(k) || "").trim();
export const num = (f: FormData, k: string) => Number(f.get(k) || 0);
export const flag = (f: FormData, k: string) => f.get(k) === "on";
export type CommandReply = {
  error?: string;
  success?: string;
  result?: { id?: string; number?: number; code?: string };
};
export function useCommand() {
  const token = useContext(TokenContext);
  const fetcher = useFetcher<CommandReply>();
  const run = (intent: string, payload: unknown) =>
    fetcher.submit(
      { csrfToken: token, intent, payload: JSON.stringify(payload) },
      { method: "post", action: "/admin" },
    );
  return { run, busy: fetcher.state !== "idle", data: fetcher.data, fetcher };
}
export function Feedback({ data }: { data?: CommandReply }) {
  return (
    <>
      {data?.error && (
        <div className="co-alert error" role="alert">
          {data.error}
        </div>
      )}
      {data?.success && (
        <div className="co-alert success" role="status">
          {data.success}
          {data.result?.code && (
            <>
              {" "}
              · <strong>{data.result.code}</strong>
            </>
          )}
        </div>
      )}
    </>
  );
}
export function CommandForm({
  intent,
  build,
  children,
  label = "Save changes",
  className = "",
  onSaved,
}: {
  intent: string;
  build: (f: FormData) => unknown;
  children: ReactNode;
  label?: string;
  className?: string;
  onSaved?: () => void;
}) {
  const cmd = useCommand();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    cmd.run(intent, build(new FormData(event.currentTarget)));
    onSaved?.();
  };
  return (
    <form className={`co-form ${className}`} onSubmit={submit}>
      <Feedback data={cmd.data} />
      {children}
      <button className="co-button primary" type="submit" disabled={cmd.busy}>
        {cmd.busy ? (
          <>
            <LoaderCircle className="animate-spin" size={16} />
            Saving…
          </>
        ) : (
          label
        )}
      </button>
    </form>
  );
}
export function Field({
  label,
  name,
  type = "text",
  value,
  required = false,
  min,
  step,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  value?: string | number;
  required?: boolean;
  min?: number;
  step?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="co-field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={value}
        required={required}
        min={min}
        step={step}
        placeholder={placeholder}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Select({
  label,
  name,
  options,
  value,
}: {
  label: string;
  name: string;
  options: (string | { value: string; label: string })[];
  value?: string;
}) {
  return (
    <label className="co-field">
      <span>{label}</span>
      <select name={name} defaultValue={value}>
        {options.map((o) => (
          <option
            key={typeof o === "string" ? o : o.value}
            value={typeof o === "string" ? o : o.value}
          >
            {typeof o === "string" ? o : o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
export function Check({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value?: boolean;
}) {
  return (
    <label className="co-check">
      <input name={name} type="checkbox" defaultChecked={value} />
      {label}
    </label>
  );
}
export function Panel({
  title,
  subtitle,
  children,
  action,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`co-panel ${className}`}>
      {(title || action) && (
        <div className="co-panel-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Badge({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`co-badge ${tone}`}>{children}</span>;
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="co-empty">{children}</div>;
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      Array.from(
        dialog.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ) || [],
      ).filter((el) => el.getClientRects().length > 0);
    focusable()[0]?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
      }
      if (event.key === "Tab") {
        const items = focusable();
        const first = items[0];
        const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("keydown", keyboard);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <div className="co-modal-backdrop" onClick={onClose}>
      <section
        ref={dialog}
        className="co-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="co-panel-head">
          <h2>{title}</h2>
          <button
            type="button"
            className="co-icon"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function PrintButton({
  label = "Print / Save PDF",
}: {
  label?: string;
}) {
  return (
    <button className="co-button" type="button" onClick={() => window.print()}>
      {label}
    </button>
  );
}
export function Download({
  kind,
  label,
  from,
  to,
  segment,
}: {
  kind: string;
  label: string;
  from?: string;
  to?: string;
  segment?: string;
}) {
  return (
    <a
      className="co-button"
      href={`/admin/export?kind=${encodeURIComponent(kind)}&from=${from || ""}&to=${to || ""}&segment=${encodeURIComponent(segment || "all")}`}
      download
    >
      {label}
    </a>
  );
}
