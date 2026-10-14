import { formatPrice } from "../lib/format";
import type { Order } from "../types";

export function OrderItemsList({ order }: { order: Order }) {
  return (
    <ul className="order-items">
      {order.items.map((item) => (
        <li key={item.foodId}>
          <span>
            {item.quantity} × {item.name}
          </span>
          <span>{formatPrice(item.lineTotal)}</span>
        </li>
      ))}
    </ul>
  );
}