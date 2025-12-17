export function parseMoney(money: string): number {
  const n = Number.parseFloat(money);
  if (!Number.isFinite(n)) throw new Error("Invalid money amount");
  return n;
}

export function formatMoney(amount: number): string {
  if (!Number.isFinite(amount)) throw new Error("Invalid money amount");
  return amount.toFixed(2);
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}
