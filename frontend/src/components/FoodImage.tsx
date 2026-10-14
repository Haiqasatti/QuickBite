import { useState, type ReactNode } from "react";
import { resolveImageUrl } from "../lib/env";

interface FoodImageProps {
  src?: string;
  name: string;
  fallback?: ReactNode;
}

/** Decorative photo (the dish name sits next to it). Falls back to a typographic tile if missing or broken. */
export function FoodImage({ src, name, fallback }: FoodImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolvedSrc = src ? resolveImageUrl(src) : undefined;

  if (!resolvedSrc || failedSrc === src) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="food-fallback" aria-hidden="true">
        <span>{name.trim().charAt(0).toUpperCase() || "Q"}</span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailedSrc(src ?? "")}
    />
  );
}