import { env } from "./env";

function createFormatter(): Intl.NumberFormat {
  const options = { minimumFractionDigits: 0, maximumFractionDigits: 2 };
  try {
    return new Intl.NumberFormat("en-PK", { style: "currency", currency: env.currency, ...options });
  } catch {
    return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", ...options });
  }
}

const priceFormatter = createFormatter();

export function formatPrice(value: number): string {
  return priceFormatter.format(value);
}

/** Money math in integer cents avoids floating-point drift. */
export function lineCents(unitPrice: number, quantity: number): number {
  return Math.round(unitPrice * 100) * quantity;
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function shortId(id: string): string {
  return id.slice(-6).toUpperCase();
}