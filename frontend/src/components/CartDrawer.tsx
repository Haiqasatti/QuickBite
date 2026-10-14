import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatPrice, fromCents, lineCents } from "../lib/format";
import { FoodImage } from "./FoodImage";
import { Icon } from "./Icons";
import { Modal } from "./Modal";
import { QuantityStepper } from "./QuantityStepper";
import { EmptyState } from "./StateViews";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, subtotal, setQuantity, remove } = useCart();

  return (
    <Modal open={open} onClose={onClose} title="Your cart" variant="drawer">
      {lines.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Add a dish from the menu and it will appear here."
          action={
            <Link className="btn btn-primary" to={{ pathname: "/", hash: "menu" }} onClick={onClose}>
              Browse the menu
            </Link>
          }
        />
      ) : (
        <>
          <ul className="cart-list">
            {lines.map((line) => (
              <li key={line.foodId} className="cart-line">
                <div className="cart-thumb">
                  <FoodImage src={line.image} name={line.name} />
                </div>
                <div className="cart-info">
                  <p className="cart-name">{line.name}</p>
                  <p className="cart-unit">{formatPrice(line.price)} each</p>
                  <QuantityStepper
                    compact
                    value={line.quantity}
                    label={line.name}
                    onChange={(next) => setQuantity(line.foodId, next)}
                  />
                </div>
                <div className="cart-side">
                  <p className="cart-total">{formatPrice(fromCents(lineCents(line.price, line.quantity)))}</p>
                  <button
                    type="button"
                    className="icon-btn icon-btn-sm"
                    onClick={() => remove(line.foodId)}
                    aria-label={`Remove ${line.name} from cart`}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="cart-footer">
            <div className="summary-row">
              <span>Subtotal</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
            <p className="muted small">Prices are confirmed again at checkout. Payment is cash on delivery.</p>
            <Link className="btn btn-primary btn-block btn-lg" to="/checkout" onClick={onClose}>
              Go to checkout
              <Icon name="arrow" size={20} />
            </Link>
          </div>
        </>
      )}
    </Modal>
  );
}