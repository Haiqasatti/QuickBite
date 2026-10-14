import type { OrderStatus } from "../types";

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function isTerminalStatus(status: OrderStatus): boolean {
  return status === "DELIVERED" || status === "CANCELLED";
}