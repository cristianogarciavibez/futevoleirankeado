import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

const nav = [
  { to: "/", label: "Ranking" },
  { to: "/historico", label: "Histórico" },
  { to: "/regras", label: "Regras" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" aria-label="Início"><Logo className="h-9 sm:h-11" /></Link>
        <nav className="flex gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="font-display rounded-md px-3 py-1.5 text-lg text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "bg-primary !text-primary-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 text-xs text-muted-foreground">
        <span>© Futevôlei Rankeado</span>
        <Link to="/admin" className="opacity-50 transition-opacity hover:opacity-100">ADM</Link>
      </div>
    </footer>
  );
}
