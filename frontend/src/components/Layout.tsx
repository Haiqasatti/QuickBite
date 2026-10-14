import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { CartDrawer } from "./CartDrawer";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function Layout() {
  const [cartOpen, setCartOpen] = useState(false);
  const { pathname, hash } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // On page changes: scroll to top and move focus to the page content (keyboard/screen-reader friendly).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!hash) {
      window.scrollTo(0, 0);
      mainRef.current?.focus({ preventScroll: true });
    }
  }, [pathname, hash]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header onOpenCart={() => setCartOpen(true)} />
      <main id="main" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}