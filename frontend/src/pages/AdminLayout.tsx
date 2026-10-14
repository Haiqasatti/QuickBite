import { NavLink, Outlet } from "react-router-dom";

const subLink = ({ isActive }: { isActive: boolean }) => (isActive ? "subnav-link is-active" : "subnav-link");

export default function AdminLayout() {
  return (
    <section className="container page" aria-labelledby="admin-title">
      <header className="page-head">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 id="admin-title">Manage QuickBite</h1>
        </div>
      </header>
      <nav className="subnav" aria-label="Admin sections">
        <NavLink to="/admin/orders" className={subLink}>
          Orders
        </NavLink>
        <NavLink to="/admin/foods" className={subLink}>
          Foods
        </NavLink>
        <NavLink to="/admin/categories" className={subLink}>
          Categories
        </NavLink>
      </nav>
      <Outlet />
    </section>
  );
}