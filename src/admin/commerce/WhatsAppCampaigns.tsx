import { useContext, useEffect, useState } from "react";
import { useFetcher } from "react-router";
import type { CommerceSnapshot } from "../../server/commerce/queries.server";
import {
  Panel,
  Field,
  Feedback,
  useCommand,
  Badge,
  date,
  TokenContext,
} from "./ui";
export default function WhatsAppCampaigns({
  data,
  connection,
  customerId,
}: {
  data: CommerceSnapshot;
  connection: { status: string; qr: string };
  customerId?: string;
}) {
  const csrfToken = useContext(TokenContext);
  const cmd = useCommand();
  const statusFetcher = useFetcher<{ whatsapp: typeof connection }>();
  const liveConnection = statusFetcher.data?.whatsapp ?? connection;
  const [audience, setAudience] = useState("all");
  useEffect(() => {
    const id = setInterval(() => {
      if (statusFetcher.state === "idle")
        statusFetcher.load("/admin/status");
    }, 10000);
    return () => clearInterval(id);
  }, [statusFetcher]);
  return (
    <>
      <div className="co-page-head">
        <div>
          <h1>
            WhatsApp campaigns<span>.</span>
          </h1>
          <p>Messages go only to real customers with WhatsApp consent.</p>
        </div>
      </div>
      <Feedback data={cmd.data} />
      <div className="co-detail-layout">
        <Panel title="Business WhatsApp">
          <p>
            Status: <Badge>{liveConnection.status}</Badge>
          </p>
          {liveConnection.qr && (
            <img
              src={liveConnection.qr}
              width={256}
              height={256}
              alt="Scan this QR code from WhatsApp Linked devices"
            />
          )}
          <p className="co-help">
            In the business phone’s WhatsApp, open Linked devices and scan the
            QR code. Session keys are stored privately in Supabase.
          </p>
          <div className="co-toolbar">
            <button
              className="co-button primary"
              disabled={cmd.busy || liveConnection.status === "connected"}
              onClick={() => cmd.run("whatsapp-connect", {})}
            >
              Connect / show QR
            </button>
            <button
              className="co-button"
              disabled={cmd.busy}
              onClick={() => cmd.run("whatsapp-disconnect", {})}
            >
              Disconnect
            </button>
          </div>
        </Panel>
        <Panel
          title={customerId ? "Message this customer" : "Compose broadcast"}
        >
          <form
            className="co-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              f.set("intent", "whatsapp-campaign");
              f.set(
                "payload",
                JSON.stringify({
                  name: String(f.get("name")),
                  message: String(f.get("message")),
                  audience,
                  customerId,
                  imageUrl: "",
                }),
              );
              f.set("csrfToken", csrfToken);
              cmd.fetcher.submit(f, {
                method: "post",
                action: "/admin",
                encType: "multipart/form-data",
              });
            }}
          >
            <Field name="name" label="Campaign name" required />
            <label className="co-field">
              <span>Recipients</span>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              >
                <option value="all">All consenting customers</option>
                {[
                  "birthdays",
                  "size-up",
                  "back-to-school",
                  ...new Set(data.customers.flatMap((c) => c.tags)),
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="co-field">
              <span>Message</span>
              <textarea name="message" required rows={4} maxLength={4000} />
            </label>
            <label className="co-field">
              <span>Optional image</span>
              <input
                type="file"
                name="imageFile"
                accept="image/png,image/jpeg,image/webp"
              />
            </label>
            <button
              className="co-button primary"
              disabled={cmd.busy || liveConnection.status !== "connected"}
            >
              Send WhatsApp {customerId ? "message" : "broadcast"}
            </button>
          </form>
        </Panel>
      </div>
      <Panel title="Campaign history">
        <div className="co-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Status</th>
                <th>Sent</th>
                <th>Failed</th>
                <th>Recipients</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.campaigns.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.name}
                    <small>{date(c.createdAt)}</small>
                  </td>
                  <td>{c.status}</td>
                  <td>{c.sentCount}</td>
                  <td>{c.failedCount}</td>
                  <td>
                    <details>
                      <summary>View statuses</summary>
                      {c.recipients.map((r) => (
                        <p key={r.id}>
                          {r.customer.name}: {r.status}
                          {r.error && ` · ${r.error}`}
                        </p>
                      ))}
                    </details>
                  </td>
                  <td>
                    <button
                      className="co-button"
                      disabled={!c.failedCount || cmd.busy}
                      onClick={() => cmd.run("whatsapp-retry", { id: c.id })}
                    >
                      Retry failures
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
