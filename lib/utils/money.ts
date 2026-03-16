import { IAccount, IHolding } from "../db/models/account";

export function calculateAccountValue(
  account: Pick<IAccount, "type" | "balance" | "holdings">
): number {
  if (account.type === "cash" || account.type === "liability") {
    return account.balance ?? 0;
  }
  return (account.holdings ?? []).reduce(
    (sum: number, h: IHolding) => sum + h.quantity * h.pricePerUnit,
    0
  );
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
