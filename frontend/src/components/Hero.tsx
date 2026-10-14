import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { env } from "../lib/env";
import { formatPrice } from "../lib/format";
import type { Food } from "../types";
import { Icon } from "./Icons";
import { FoodImage } from "./FoodImage";

function PlateArt() {
  return (
    <svg viewBox="0 0 400 400" role="presentation" aria-hidden="true" className="plate-art">
      <circle cx="200" cy="200" r="168" fill="var(--surface-2)" />
      <circle cx="200" cy="200" r="138" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="2" />
      <circle cx="200" cy="200" r="98" fill="none" stroke="var(--line)" strokeWidth="2" />
      <circle cx="200" cy="200" r="56" fill="var(--accent)" />
      <path d="M200 144a56 56 0 0 1 0 112" fill="none" stroke="var(--accent-hover)" strokeWidth="6" />
      <path d="M44 120v160M32 120v46a12 12 0 0 0 24 0v-46M356 120c-18 18-18 62 0 80v80" fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function HeroVisual({ featured }: { featured: Food | null }) {
  if (env.heroImageUrl) {
    return (
      <figure className="hero-visual">
        <FoodImage src={env.heroImageUrl} name="QuickBite" fallback={<PlateArt />} />
      </figure>
    );
  }
  if (featured?.image) {
    return (
      <figure className="hero-visual">
        <FoodImage src={featured.image} name={featured.name} fallback={<PlateArt />} />
        <figcaption>
          <span>{featured.name}</span>
          <span>{formatPrice(featured.price)}</span>
        </figcaption>
      </figure>
    );
  }
  return (
    <div className="hero-visual hero-art">
      <PlateArt />
    </div>
  );
}

export function Hero({ featured }: { featured: Food | null }) {
  const { user } = useAuth();

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">Food ordering</p>
          <h1 id="hero-title">Dinner, decided.</h1>
          <p className="hero-lede">
            Browse the QuickBite menu, build your order in a minute and pay in cash when it arrives.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary btn-lg" href="#menu">
              Explore menu
              <Icon name="arrow" size={20} />
            </a>
            {!user ? (
              <Link className="btn btn-ghost btn-lg" to="/register">
                Create an account
              </Link>
            ) : null}
          </div>
        </div>
        <HeroVisual featured={featured} />
      </div>
    </section>
  );
}