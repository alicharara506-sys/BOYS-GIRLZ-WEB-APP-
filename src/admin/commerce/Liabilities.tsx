import type { CommerceSnapshot } from "../../server/commerce/queries.server";
import { Panel, CommandForm, Field, amount, str, usd } from "./ui";
export function Liabilities({ data }: { data: CommerceSnapshot }) {
  return (
    <>
      <div className="co-page-head">
        <h1>
          Liabilities<span>.</span>
        </h1>
      </div>
      <Panel title="Record liability">
        <CommandForm
          intent="liability"
          build={(f) => ({
            creditor: str(f, "creditor"),
            amount: amount(f.get("amount")),
            settled: amount(f.get("settled")),
            note: str(f, "note"),
          })}
        >
          <Field name="creditor" label="Creditor" required />
          <Field
            name="amount"
            label="Amount $"
            type="number"
            min={0}
            step="0.01"
            required
          />
          <Field
            name="settled"
            label="Already settled $"
            type="number"
            min={0}
            step="0.01"
            value={0}
          />
          <Field name="note" label="Note" />
        </CommandForm>
      </Panel>
      {data.liabilities.map((l) => (
        <Panel
          key={l.id}
          title={l.creditor}
          subtitle={`Outstanding ${usd(l.amount - l.settled)}`}
        >
          <CommandForm
            intent="liability"
            build={(f) => ({
              id: l.id,
              creditor: l.creditor,
              amount: l.amount,
              settled: amount(f.get("settled")),
              note: str(f, "note"),
            })}
          >
            <Field
              name="settled"
              label="Total settled $"
              type="number"
              min={0}
              step="0.01"
              value={l.settled / 100}
            />
            <Field name="note" label="Note" value={l.note} />
          </CommandForm>
        </Panel>
      ))}
    </>
  );
}
