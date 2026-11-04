export function financials(
  orders: {
    status: string;
    total: number;
    createdAt: string;
    items: { unitCost: number | null; quantity: number }[];
  }[],
  expenses: { amount: number; date: string }[],
  liabilities: { amount: number; settled: number }[],
  from: string,
  to: string,
) {
  const accepted = orders.filter(
    (o) =>
      ["completed", "delivered"].includes(o.status) &&
      o.createdAt.slice(0, 10) >= from &&
      o.createdAt.slice(0, 10) <= to,
  );
  const sales = accepted.reduce((s, o) => s + o.total, 0);
  const cogs = accepted
    .flatMap((o) => o.items)
    .reduce(
      (s, l) => s + (l.unitCost === null ? 0 : l.unitCost * l.quantity),
      0,
    );
  const expense = expenses
    .filter((e) => e.date.slice(0, 10) >= from && e.date.slice(0, 10) <= to)
    .reduce((s, e) => s + e.amount, 0);
  return {
    Sales: sales,
    Expenses: expense,
    Liabilities: liabilities.reduce((s, l) => s + l.amount - l.settled, 0),
    COGS: cogs,
    "Gross Profit": sales - cogs,
    "Net Profit": sales - cogs - expense,
  };
}
