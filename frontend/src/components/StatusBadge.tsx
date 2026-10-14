import { ORDER_STATUS_LABELS } from "../lib/orderStatus";
import type { OrderStatus } from "../types";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{ORDER_STATUS_LABELS[status]}</span>;
}