import type { Prisma } from "@prisma/client";
import { CommerceError } from "./rules";
export type Tx = Prisma.TransactionClient;
export const accounts = [
  ["1000", "Cash on hand", "asset"],
  ["1020", "Whish wallet", "asset"],
  ["1100", "Accounts receivable / COD", "asset"],
  ["1200", "Inventory asset", "asset"],
  ["2000", "Accounts payable", "liability"],
  ["2100", "Tax payable", "liability"],
  ["2200", "Store credit liability", "liability"],
  ["2210", "Gift card liability", "liability"],
  ["3000", "Owner equity / opening balances", "equity"],
  ["4000", "POS sales", "income"],
  ["4010", "Online sales", "income"],
  ["4020", "Shipping income", "income"],
  ["4090", "Sales returns", "contra-income"],
  ["5000", "Cost of goods sold", "expense"],
  ["5010", "Stock loss / adjustments", "expense"],
  ["5100", "Rent", "expense"],
  ["5110", "Salaries", "expense"],
  ["5120", "Utilities", "expense"],
  ["5130", "Marketing", "expense"],
  ["5140", "Supplies", "expense"],
  ["5190", "Other expenses", "expense"],
  ["5200", "Cash variance", "expense"],
] as const;
export const paymentAccount = (method: string) =>
  ({ cash: "1000", whish: "1020", credit: "2200", gift: "2210" })[method] ||
  "1000";
export async function journal(
  tx: Tx,
  reference: string,
  memo: string,
  lines: { accountId: string; debit?: number; credit?: number }[],
  date = new Date(),
) {
  const clean = lines
    .filter((line) => line.debit || line.credit)
    .map((line) => ({
      accountId: line.accountId,
      debit: line.debit || 0,
      credit: line.credit || 0,
    }));
  if (
    clean.some(
      (line) =>
        !Number.isSafeInteger(line.debit) ||
        !Number.isSafeInteger(line.credit) ||
        line.debit < 0 ||
        line.credit < 0 ||
        (line.debit > 0 && line.credit > 0),
    ) ||
    clean.reduce((sum, line) => sum + line.debit - line.credit, 0) !== 0
  )
    throw new CommerceError(
      "The accounting entry did not balance. Nothing was saved.",
    );
  if (!clean.length) return;
  await tx.journal.create({
    data: { reference, memo, date, lines: { create: clean } },
  });
}
export async function cashEvent(
  tx: Tx,
  amount: number,
  reason: string,
  required = false,
) {
  const drawer = await tx.drawer.findFirst({ where: { closedAt: null } });
  if (!drawer && required)
    throw new CommerceError(
      "Open the cash drawer before taking or refunding cash.",
    );
  if (drawer && amount)
    await tx.cashEvent.create({
      data: { drawerId: drawer.id, amount, reason },
    });
  return drawer;
}
