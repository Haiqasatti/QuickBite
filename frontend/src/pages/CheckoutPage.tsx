import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Field } from "../components/Field";
import { FoodImage } from "../components/FoodImage";
import { Icon } from "../components/Icons";
import { EmptyState } from "../components/StateViews";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { ApiError, getErrorMessage } from "../lib/api";
import { catalogApi, orderApi } from "../lib/endpoints";
import { formatPrice, fromCents, lineCents } from "../lib/format";
import type { Food } from "../types";

async function loadLiveMenu(): Promise<Food[]> {
  return (await catalogApi.foods()).foods;
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const { state: menuState, reload } = useAsyncData(loadLiveMenu);
  const [address, setAddress] = useState(user?.address ?? "");
  const [addressError, setAddressError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const liveById = useMemo(
    () =>
      menuState.status === "success"
        ? new Map<string, Food>(menuState.data.map((food): [string, Food] => [food.id, food]))
        : null,
    [menuState]
  );

  const rows = cart.lines.map((line) => {
    const live = liveById?.get(line.foodId);
    const unavailable = liveById !== null && live === undefined;
    const unitPrice = live?.price ?? line.price;
    return { line, unitPrice, unavailable, cents: lineCents(unitPrice, line.quantity) };
  });

  const hasUnavailable = rows.some((row) => row.unavailable);
  const priceChanged = rows.some((row) => !row.unavailable && row.unitPrice !== row.line.price);
  const total = fromCents(rows.reduce((sum, row) => sum + row.cents, 0));
  const verifying = menuState.status === "loading";

  if (cart.lines.length === 0) {
    return (
      <div className="container page">
        <EmptyState
          title="Your cart is empty"
          description="Add some dishes from the menu before checking out."
          action={
            <Link className="btn btn-primary" to={{ pathname: "/", hash: "menu" }}>
              Browse the menu
            </Link>
          }
        />
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const trimmed = address.trim();
    if (trimmed.length < 5) {
      setAddressError("Enter a delivery address (at least 5 characters).");
      return;
    }
    if (trimmed.length > 250) {
      setAddressError("Address must be at most 250 characters.");
      return;
    }
    setAddressError(undefined);
    setFormError(null);
    setSubmitting(true);

    try {
      const { order } = await orderApi.create({
        items: cart.lines.map((line) => ({ foodId: line.foodId, quantity: line.quantity })),
        deliveryAddress: trimmed,
        paymentMethod: "COD",
      });
      cart.clear();
      navigate("/orders", { replace: true, state: { placedOrderId: order.id } });
    } catch (error) {
      setFormError(getErrorMessage(error));
      if (error instanceof ApiError && (error.status === 404 || error.status === 409)) reload();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="container page" aria-labelledby="checkout-title">
      <header className="page-head">
        <h1 id="checkout-title">Checkout</h1>
      </header>

      <div className="checkout-grid">
        <form onSubmit={(event) => void handleSubmit(event)} noValidate className="form panel">
          <h2>Delivery</h2>
          {formError ? (
            <div className="form-alert" role="alert">
              {formError}
            </div>
          ) : null}
          <Field label="Delivery address" hint="Street, area and any landmark the rider should know." error={addressError}>
            {(props) => (
              <textarea
                {...props}
                rows={3}
                autoComplete="street-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            )}
          </Field>

          <fieldset className="payment">
            <legend>Payment</legend>
            <p className="payment-option">
              <Icon name="check" size={18} />
              <span>
                <strong>Cash on delivery</strong>
                <br />
                <span className="muted small">Pay the rider when your order arrives. No online payment is taken.</span>
              </span>
            </p>
          </fieldset>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={submitting || verifying || hasUnavailable}
          >
            {submitting ? "Placing order…" : `Place order · ${formatPrice(total)}`}
          </button>
        </form>

        <aside className="panel summary" aria-labelledby="summary-title">
          <h2 id="summary-title">Order summary</h2>

          {hasUnavailable ? (
            <div className="banner banner-warn" role="alert">
              <Icon name="alert" size={18} />
              <span>Some items are no longer available. Remove them to continue.</span>
            </div>
          ) : null}
          {priceChanged ? (
            <div className="banner banner-info" role="status">
              <Icon name="alert" size={18} />
              <span>Some prices changed since you added them. The totals below are current.</span>
            </div>
          ) : null}
          {menuState.status === "error" ? (
            <div className="banner banner-info" role="status">
              <Icon name="alert" size={18} />
              <span>We couldn't re-check current prices. The final total is confirmed when you place the order.</span>
            </div>
          ) : null}

          <ul className="summary-list">
            {rows.map((row) => (
              <li key={row.line.foodId} className={row.unavailable ? "summary-line is-unavailable" : "summary-line"}>
                <div className="cart-thumb">
                  <FoodImage src={row.line.image} name={row.line.name} />
                </div>
                <div className="summary-info">
                  <p className="cart-name">{row.line.name}</p>
                  <p className="muted small">
                    {row.line.quantity} × {formatPrice(row.unitPrice)}
                    {row.unavailable ? " · unavailable" : ""}
                  </p>
                  {row.unavailable ? (
                    <button type="button" className="link-btn" onClick={() => cart.remove(row.line.foodId)}>
                      Remove from cart
                    </button>
                  ) : null}
                </div>
                <p className="cart-total">{formatPrice(fromCents(row.cents))}</p>
              </li>
            ))}
          </ul>

          <div className="summary-row summary-total">
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <p className="muted small">The server recalculates the total from current menu prices when you place the order.</p>
        </aside>
      </div>
    </section>
  );
}