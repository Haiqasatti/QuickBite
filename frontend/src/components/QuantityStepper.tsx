import { MAX_ITEM_QUANTITY } from "../lib/constants";
import { Icon } from "./Icons";

interface QuantityStepperProps {
  value: number;
  label: string;
  onChange: (next: number) => void;
  compact?: boolean;
}

export function QuantityStepper({ value, label, onChange, compact = false }: QuantityStepperProps) {
  return (
    <div className={compact ? "stepper stepper-compact" : "stepper"} role="group" aria-label={`Quantity for ${label}`}>
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(value - 1)}
        aria-label={value <= 1 ? `Remove ${label} from cart` : `Decrease quantity of ${label}`}
      >
        <Icon name={value <= 1 ? "trash" : "minus"} size={16} />
      </button>
      <span className="stepper-value" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_ITEM_QUANTITY}
        aria-label={`Increase quantity of ${label}`}
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}