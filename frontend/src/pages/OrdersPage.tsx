import { Link, useLocation } from "react-router-dom";
import { Icon } from "../components/Icons";
import { OrderItemsList } from "../components/OrderItemsList";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import { StatusBadge } from "../components/StatusBadge";
import { useAsyncData } from "../hooks/useAsyncData";
import { orderApi } from "../lib/endpoints";
import { formatDateTime, formatPrice, shortId } from "../lib/format";
import { getPlacedOrderId } from "../lib/guards";
import type { Order } from "../types";

async function loadMyOrders(): Promise<Order[]> {
  return (await orderApi.mine()).orders;
}

export default function OrdersPage() {
  const { state, reload } = useAsyncData(loadMyOrders);
  const location = useLocation();
  const placedId = getPlacedOrderId(location.state);

  return (
    <section className="container page" aria-labelledby="orders-title">
      <header className="page-head">
        <h1 id="orders-title">My orders</h1>
        <button type="button" className="btn btn-ghost btn-sm" onClick={reload}>
          <Icon name="refresh" size={16} />
          Refresh
        </button>
      </header>

      {placedId ? (
        <div className="banner banner-success" role="status">
          <Icon name="check" size={18} />
          <span>Order #{shortId(placedId)} has been received. You'll pay cash on delivery.</span>
        </div>
      ) : null}

      {state.status === "loading" ? <LoadingState label="Loading your orders…" /> : null}
      {state.status === "error" ? <ErrorState message={state.message} onRetry={reload} /> : null}
      {state.status === "success" && state.data.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you place an order it will show up here."
          action={
            <Link className="btn btn-primary" to={{ pathname: "/", hash: "menu" }}>
              Browse the menu
            </Link>
          }
        />
      ) : null}
      {state.status === "success" && state.data.length > 0 ? (
        <ul className="order-list">
          {state.data.map((order) => (
            <li key={order.id} className="order-card">
              <div className="order-head">
                <div>
                  <h2>Order #{shortId(order.id)}</h2>
                  <p className="muted small">{formatDateTime(order.createdAt)}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <OrderItemsList order={order} />
              <div className="summary-row summary-total">
                <span>Total (cash on delivery)</span>
                <strong>{formatPrice(order.totalAmount)}</strong>
              </div>
              <p className="muted small">Deliver to: {order.deliveryAddress}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}