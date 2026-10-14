import type { ReactNode } from "react";
import { Icon } from "./Icons";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="state" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state state-error" role="alert">
      <Icon name="alert" size={28} />
      <h3>We couldn't load this</h3>
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          <Icon name="refresh" size={18} />
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="state">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}

export function FoodGridSkeleton() {
  return (
    <div className="food-grid" aria-busy="true" aria-label="Loading menu">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="food-card skeleton-card" aria-hidden="true">
          <div className="food-media skeleton" />
          <div className="food-body">
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
          </div>
        </div>
      ))}
    </div>
  );
}