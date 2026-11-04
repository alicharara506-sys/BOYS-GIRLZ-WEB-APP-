import makeWASocket, {
  BufferJSON,
  DisconnectReason,
  initAuthCreds,
  proto,
  type AuthenticationCreds,
  type SignalDataTypeMap,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import pino from "pino";
import { z } from "zod";
import { db } from "./commerce/db.server";
import { CommerceError } from "./commerce/rules";
import { campaignAudience } from "./commerce/operations.server";
import { supabaseConfig, storageSupabase } from "./supabase.server";
type Socket = ReturnType<typeof makeWASocket>;
type Runtime = {
  socket?: Socket;
  qr: string;
  status: string;
  busy: boolean;
  timer?: ReturnType<typeof setInterval>;
  connecting: boolean;
};
const globalWA = globalThis as typeof globalThis & { bngWA?: Runtime };
const runtime = (globalWA.bngWA ||= {
  qr: "",
  status: "disconnected",
  busy: false,
  connecting: false,
});
const json = (value: unknown) =>
  JSON.parse(JSON.stringify(value, BufferJSON.replacer));
const revive = <T>(value: unknown): T =>
  JSON.parse(JSON.stringify(value), BufferJSON.reviver);
export const whatsappStatus = () => ({
  status: runtime.status,
  qr: runtime.qr,
});
export async function connectWhatsApp() {
  if (runtime.socket || runtime.connecting) return whatsappStatus();
  runtime.connecting = true;
  try {
    const stored = await db.whatsAppKey.findUnique({ where: { id: "creds" } });
    const creds = stored
      ? revive<AuthenticationCreds>(stored.value)
      : initAuthCreds();
    const socket = makeWASocket({
      logger: pino({ level: "silent" }),
      auth: {
        creds,
        keys: {
          get: async (type, ids) => {
            const result: Record<string, SignalDataTypeMap[typeof type]> = {};
            for (const id of ids) {
              const entry = await db.whatsAppKey.findUnique({
                where: { id: `${type}:${id}` },
              });
              if (entry) {
                let value = revive<SignalDataTypeMap[typeof type]>(entry.value);
                if (type === "app-state-sync-key")
                  value = proto.Message.AppStateSyncKeyData.fromObject(
                    value as object,
                  ) as unknown as typeof value;
                result[id] = value;
              }
            }
            return result;
          },
          set: async (values) => {
            for (const [type, entries] of Object.entries(values))
              for (const [id, value] of Object.entries(entries || {})) {
                const key = `${type}:${id}`;
                if (value)
                  await db.whatsAppKey.upsert({
                    where: { id: key },
                    create: { id: key, value: json(value) },
                    update: { value: json(value) },
                  });
                else await db.whatsAppKey.deleteMany({ where: { id: key } });
              }
          },
        },
      },
      markOnlineOnConnect: false,
      syncFullHistory: false,
    });
    runtime.socket = socket;
    runtime.status = "connecting";
    socket.ev.on("creds.update", async () => {
      await db.whatsAppKey
        .upsert({
          where: { id: "creds" },
          create: { id: "creds", value: json(creds) },
          update: { value: json(creds) },
        })
        .catch(() => {
          runtime.status = "storage-error";
          runtime.socket?.end(new Error("Session storage unavailable."));
        });
    });
    socket.ev.on("connection.update", async (update) => {
      if (update.qr) {
        runtime.qr = await QRCode.toDataURL(update.qr);
        runtime.status = "scan-qr";
      }
      if (update.connection === "open") {
        runtime.qr = "";
        runtime.status = "connected";
      }
      if (update.connection === "close") {
        runtime.socket = undefined;
        runtime.qr = "";
        runtime.status = "disconnected";
        const status = (
          update.lastDisconnect?.error as { output?: { statusCode?: number } }
        )?.output?.statusCode;
        if (status !== DisconnectReason.loggedOut)
          setTimeout(() => {
            void connectWhatsApp().catch(() => {
              runtime.status = "connection-error";
            });
          }, 5000);
      }
    });
    return whatsappStatus();
  } finally {
    runtime.connecting = false;
  }
}
export async function whatsappCommand(intent: string, raw: unknown) {
  if (intent === "whatsapp-connect") return connectWhatsApp();
  if (intent === "whatsapp-disconnect") {
    await runtime.socket?.logout();
    runtime.socket = undefined;
    runtime.qr = "";
    runtime.status = "disconnected";
    await db.whatsAppKey.deleteMany();
    return whatsappStatus();
  }
  if (intent === "whatsapp-retry") {
    const input = z.object({ id: z.string() }).parse(raw);
    await db.campaignRecipient.updateMany({
      where: { campaignId: input.id, status: "failed" },
      data: { status: "pending", error: "", claimUntil: null },
    });
    await db.campaign.update({
      where: { id: input.id },
      data: { status: "queued", failedCount: 0 },
    });
    return { id: input.id };
  }
  if (intent === "whatsapp-campaign") {
    const input = z
      .object({
        name: z.string().trim().min(1).max(150),
        message: z.string().trim().min(1).max(4000),
        audience: z.string(),
        customerId: z.string().optional(),
        imageUrl: z.string().default(""),
      })
      .parse(raw);
    if (
      input.imageUrl &&
      !input.imageUrl.startsWith(
        `${supabaseConfig().url}/storage/v1/object/public/product-images/`,
      )
    )
      throw new CommerceError(
        "Upload the campaign image to this shop’s image library.",
      );
    if (runtime.status !== "connected")
      throw new CommerceError(
        "Connect the business WhatsApp account before sending.",
      );
    const customers = (await campaignAudience(input.audience)).filter(
      (c) =>
        c.consentWhatsapp &&
        !c.demo &&
        /^\+[1-9]\d{6,14}$/.test(c.phone) &&
        (!input.customerId || c.id === input.customerId),
    );
    if (!customers.length)
      throw new CommerceError(
        "No real customers with valid WhatsApp numbers and consent match this audience.",
      );
    return db.campaign.create({
      data: {
        name: input.name,
        message: input.message,
        imageUrl: input.imageUrl,
        audience: input.audience,
        channel: "whatsapp",
        count: customers.length,
        status: "queued",
        recipients: { create: customers.map((c) => ({ customerId: c.id })) },
      },
    });
  }
  throw new CommerceError("Unknown WhatsApp action.");
}
async function nextMessage() {
  if (runtime.busy || runtime.status !== "connected" || !runtime.socket) return;
  runtime.busy = true;
  try {
    const recipient = await db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM campaign_recipients WHERE status='pending' AND claim_until IS NULL ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED`;
      if (!rows.length) return null;
      return tx.campaignRecipient.update({
        where: { id: rows[0].id },
        data: {
          claimUntil: new Date(Date.now() + 120000),
          attempts: { increment: 1 },
        },
        include: { customer: true, campaign: true },
      });
    });
    if (!recipient) return;
    try {
      if (!recipient.customer.consentWhatsapp || recipient.customer.demo)
        throw new Error("Consent is missing or this is a demo contact.");
      const jid =
        recipient.customer.phone.replace(/\D/g, "") + "@s.whatsapp.net";
      const image = recipient.campaign.imageUrl
        ? await storageSupabase()
            .storage.from("product-images")
            .download(
              decodeURIComponent(
                recipient.campaign.imageUrl.split("/product-images/")[1],
              ),
            )
        : null;
      if (image?.error) throw new Error("Campaign image could not be read.");
      const sent = await runtime.socket.sendMessage(
        jid,
        image?.data
          ? {
              image: Buffer.from(await image.data.arrayBuffer()),
              caption: recipient.campaign.message,
            }
          : { text: recipient.campaign.message },
      );
      await db.campaignRecipient.update({
        where: { id: recipient.id },
        data: {
          status: "sent",
          messageId: sent?.key.id,
          sentAt: new Date(),
          claimUntil: null,
        },
      });
    } catch {
      await db.campaignRecipient.update({
        where: { id: recipient.id },
        data: {
          status: "failed",
          error: "Message could not be confirmed. Review before retrying.",
          claimUntil: null,
        },
      });
    }
    const statuses = await db.campaignRecipient.groupBy({
      by: ["status"],
      where: { campaignId: recipient.campaignId },
      _count: true,
    });
    const count = (s: string) =>
      statuses.find((r) => r.status === s)?._count || 0;
    await db.campaign.update({
      where: { id: recipient.campaignId },
      data: {
        sentCount: count("sent"),
        failedCount: count("failed"),
        status: count("pending")
          ? "sending"
          : count("failed")
            ? "partial"
            : "sent",
        sentAt: count("pending") ? undefined : new Date(),
      },
    });
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 500),
    );
  } finally {
    runtime.busy = false;
  }
}
export async function startWhatsAppWorker() {
  if (runtime.timer) return;
  await db.campaignRecipient.updateMany({
    where: { status: "pending", claimUntil: { lt: new Date() } },
    data: {
      status: "failed",
      error:
        "Delivery outcome uncertain after a restart. Review before retrying.",
      claimUntil: null,
    },
  });
  runtime.timer = setInterval(() => {
    void nextMessage().catch(() => {});
  }, 1500);
  runtime.timer.unref();
  if (await db.whatsAppKey.findUnique({ where: { id: "creds" } }))
    await connectWhatsApp();
}
