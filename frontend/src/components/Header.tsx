import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Icon } from "./Icons";
import { Logo } from "./Logo";

const linkClass = ({ isActive }: { isActive: boolean }) => (isActive ? "nav-link is-active" : "nav-link");

export function Header({ onOpenCart }: { onOpenCart: () => void }) {
  const { user, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  const closeNav = () => setNavOpen(false);
  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand" onClick={closeNav} aria-label="QuickBite home">
          <Logo />
        </Link>

        <nav id="site-nav" className="site-nav" data-open={navOpen} aria-label="Primary">
          <ul className="nav-list">
            <li>
              <Link className="nav-link" to={{ pathname: "/", hash: "menu" }} onClick={closeNav}>
                Menu
              </Link>
            </li>
            {user ? (
              <li>
                <NavLink className={linkClass} to="/orders" onClick={closeNav}>
                  My orders
                </NavLink>
              </li>
            ) : null}
            {isAdmin ? (
              <li>
                <NavLink className={linkClass} to="/admin" onClick={closeNav}>
                  Admin
                </NavLink>
              </li>
            ) : null}
          </ul>
          <div className="nav-account">
            {user ? (
              <>
                <span className="nav-greeting">Hi, {firstName}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    logout();
                    closeNav();
                  }}
                >
                  <Icon name="logout" size={16} />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link className="nav-link" to="/login" onClick={closeNav}>
                  Sign in
                </Link>
                <Link className="btn btn-primary btn-sm" to="/register" onClick={closeNav}>
                  Create account
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="cart-btn"
            onClick={onOpenCart}
            aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
          >
            <Icon name="cart" size={22} />
            {count > 0 ? (
              <span className="badge" aria-hidden="true">
                {count}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            className="icon-btn nav-toggle"
            aria-expanded={navOpen}
            aria-controls="site-nav"
            aria-label={navOpen ? "Close menu" : "Open menu"}
            onClick={() => setNavOpen((value) => !value)}
          >
            <Icon name={navOpen ? "close" : "menu"} />
          </button>
        </div>
      </div>
    </header>
  );
}