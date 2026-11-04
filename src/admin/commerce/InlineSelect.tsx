import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Modal, useCommand, Feedback } from "./ui";
export function InlineSelect({
  kind,
  value,
  onChange,
  options,
  shopId,
  required = true,
}: {
  kind: "shop" | "category";
  value: string;
  onChange: (id: string, name?: string) => void;
  options: { id: string; name: string }[];
  shopId?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const cmd = useCommand();
  const seen = useRef<unknown>(null);
  useEffect(() => {
    if (cmd.data?.result?.id && seen.current !== cmd.data) {
      seen.current = cmd.data;
      onChange(cmd.data.result.id, name);
      setOpen(false);
    }
  }, [cmd.data, name, onChange]);
  return (
    <>
      <label className="co-field">
        <span>{kind === "shop" ? "Shop" : "Category"}</span>
        <select
          required={required}
          value={value}
          onChange={(e) => {
            if (e.target.value === "__new") setOpen(true);
            else
              onChange(
                e.target.value,
                options.find((o) => o.id === e.target.value)?.name,
              );
          }}
        >
          <option value="">Choose {kind}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
          <option value="__new">＋ Add new {kind}</option>
        </select>
      </label>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <Modal title={`Add ${kind}`} onClose={() => setOpen(false)}>
            <form
              className="co-form"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                cmd.run(`create-${kind}`, { name, shopId });
              }}
            >
              <Feedback data={cmd.data} />
              <label className="co-field">
                <span>Name</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={150}
                />
              </label>
              <button
                className="co-button primary"
                disabled={cmd.busy || (kind === "category" && !shopId)}
              >
                Save {kind}
              </button>
            </form>
          </Modal>,
          document.body,
        )}
    </>
  );
}
