import { useCart } from "../context/CartContext";
import { formatPrice } from "../lib/format";
import type { Food } from "../types";
import { FoodImage } from "./FoodImage";
import { Icon } from "./Icons";
import { QuantityStepper } from "./QuantityStepper";

export function FoodCard({ food }: { food: Food }) {
  const { quantityOf, add, setQuantity } = useCart();
  const quantity = quantityOf(food.id);

  return (
    <article className="food-card">
      <div className="food-media">
        <FoodImage src={food.image} name={food.name} />
      </div>
      <div className="food-body">
        <div className="food-head">
          <h3>{food.name}</h3>
          <p className="food-price">{formatPrice(food.price)}</p>
        </div>
        {food.description ? <p className="food-desc">{food.description}</p> : null}
        <div className="food-actions">
          {!food.isAvailable ? (
            <p className="unavailable">Currently unavailable</p>
          ) : quantity === 0 ? (
            <button type="button" className="btn btn-primary btn-block" onClick={() => add(food)}>
              <Icon name="plus" size={18} />
              Add to cart
              <span className="visually-hidden">: {food.name}</span>
            </button>
          ) : (
            <QuantityStepper
              value={quantity}
              label={food.name}
              onChange={(next) => setQuantity(food.id, next)}
            />
          )}
        </div>
      </div>
    </article>
  );
}