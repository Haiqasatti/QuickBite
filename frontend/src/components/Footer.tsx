import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { env } from "../lib/env";
import { Logo } from "./Logo";

export function Footer() {
  const { user } = useAuth();

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p className="footer-blurb">Order from the QuickBite menu and pay cash on delivery.</p>
        </div>
        <nav aria-label="Footer">
          <h2>Explore</h2>
          <ul>
            <li>
              <Link to={{ pathname: "/", hash: "menu" }}>Menu</Link>
            </li>
            {user ? (
              <li>
                <Link to="/orders">My orders</Link>
              </li>
            ) : (
              <>
                <li>
                  <Link to="/login">Sign in</Link>
                </li>
                <li>
                  <Link to="/register">Create account</Link>
                </li>
              </>
            )}
          </ul>
        </nav>
        {env.contactEmail ? (
          <div>
            <h2>Contact</h2>
            <p>
              <a href={`mailto:${env.contactEmail}`}>{env.contactEmail}</a>
            </p>
          </div>
        ) : null}
      </div>
      <div className="container footer-legal">© {new Date().getFullYear()} QuickBite</div>
    </footer>
  );
}