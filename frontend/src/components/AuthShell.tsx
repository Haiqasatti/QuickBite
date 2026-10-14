import type { ReactNode } from "react";
import { Logo } from "./Logo";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="container auth-page">
      <aside className="auth-aside" aria-hidden="true">
        <Logo />
        <p className="auth-aside-title">Browse the menu, build your cart and pay cash on delivery.</p>
      </aside>
      <div className="auth-card">
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
        <p className="auth-footer">{footer}</p>
      </div>
    </div>
  );
}