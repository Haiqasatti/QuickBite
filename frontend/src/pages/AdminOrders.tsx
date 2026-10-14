import { useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { OrderItemsList } from "../components/OrderItemsList";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../context/ToastContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { getErrorMessage } from "../lib/api";
import { orderApi } from "../lib/endpoints";
import { formatDateTime, formatPrice, shortId } from "../lib/format";
import { isTerminalStatus, ORDER_STATUS_LABELS, ORDER_STATUS_ORDER } from "../lib/orderStatus";
import type { Order, OrderStatus } from "../types";

async function loadOrders(): Promise<Order[]> {
  return (await orderApi.all()).orders;
}

export default function AdminOrders() {
  const { state, reload } = useAsyncData(loadOrders);
  const { notify } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState<Order | null>(null);

  async function applyStatus(order: Order, status: OrderStatus) {
    setBusyId(order.id);
    try {
      await orderApi.updateStatus(order.id, status);
      notify(`Order #${shortId(order.id)} marked ${ORDER_STATUS_LABELS[status].toLowerCase()}.`, "success");
      reload();
    } catch (error) {
      notify(getErrorMessage(error), "error");
    } finally {
      setBusyId(null);
      setPendingCancel(null);
    }
  }

  function handleChange(order: Order, status: OrderStatus) {
    if (status === order.status) return;
    if (status === "CANCELLED") {
      setPendingCancel(order);
      return;
    }
    void applyStatus(order, status);
  }

  if (state.status === "loading") return <LoadingState label="Loading orders…" />;
  if (state.status === "error") return <ErrorState message={state.message} onRetry={reload} />;
  if (state.data.length === 0) {
    return <EmptyState title="No orders yet" description="Orders placed by customers will appear here." />;
  }

  return (
    <>
      <ul className="order-list">
        {state.data.map((order) => {
          const selectId = `status-${order.id}`;
          return (
            <li key={order.id} className="order-card">
              <div className="order-head">
                <div>
                  <h2>Order #{shortId(order.id)}</h2>
                  <p className="muted small">
                    {formatDateTime(order.createdAt)}
                    {order.customer ? ` · ${order.customer.name} (${order.customer.email})` : ""}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <OrderItemsList order={order} />
              <div className="summary-row summary-total">
                <span>Total (cash on delivery)</span>
                <strong>{formatPrice(order.totalAmount)}</strong>
              </div>
              <p className="muted small">Deliver to: {order.deliveryAddress}</p>
              <div className="order-admin">
                <label htmlFor={selectId}>Update status</label>
                <select
                  id={selectId}
                  value={order.status}
                  disabled={busyId === order.id || isTerminalStatus(order.status)}
                  onChange={(event) => handleChange(order, event.target.value as OrderStatus)}
                >
                  {ORDER_STATUS_ORDER.map((status) => (
                    <option key={status} value={status}>
                      {ORDER_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
                {isTerminalStatus(order.status) ? (
                  <span className="muted small">Finished orders can't be changed.</span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={pendingCancel !== null}
        title="Cancel this order?"
        message={
          pendingCancel
            ? `Order #${shortId(pendingCancel.id)} will be marked as cancelled and can't be changed afterwards.`
            : ""
        }
        confirmLabel="Cancel order"
        busy={pendingCancel !== null && busyId === pendingCancel.id}
        onConfirm={() => {
          if (pendingCancel) void applyStatus(pendingCancel, "CANCELLED");
        }}
        onCancel={() => setPendingCancel(null)}
      />
    </>
  );
}