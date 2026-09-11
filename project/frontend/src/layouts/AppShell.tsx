import { Link, Outlet, useLocation } from "react-router-dom";
import { useExpertiseStore } from "../stores/expertiseStore";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "AI Agent", to: "/agent" },
  { label: "Datasets", to: "/datasets" },
  { label: "Experiments", to: "/experiments" },
  { label: "Models", to: "/models" },
  { label: "Blockchain Ledger", to: "/blockchain" },
  { label: "Analytics", to: "/analytics" },
  { label: "Settings", to: "/settings" },
];

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "LEVEL 1 — Guided Mode",
  INTERMEDIATE: "LEVEL 2 — Assisted Mode",
  EXPERT: "LEVEL 3 — Expert Mode",
};

const MOBILE_NAV_ITEMS = NAV_ITEMS.slice(0, 4);

export default function AppShell() {
  const location = useLocation();
  const level = useExpertiseStore((s) => s.level);

  return (
    <div className="flex min-h-screen bg-base-950 text-base-100">
      <aside className="hidden w-60 shrink-0 border-r border-base-800 md:flex md:flex-col">
        <div className="px-5 py-5 font-display text-lg font-semibold">AutoML<span className="text-accent">/</span>Agent</div>
        <nav className="flex-1 px-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  active ? "bg-accent/15 text-accent" : "text-base-100/70 hover:bg-base-900 hover:text-base-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-base-800 bg-base-950/95 px-4 backdrop-blur md:px-6">
          <input
            type="search"
            placeholder="Search datasets, experiments, models..."
            className="hidden w-80 max-w-full rounded-md border border-base-800 bg-base-900 px-3 py-1.5 text-sm outline-none focus:border-accent sm:block"
          />
          <div className="flex items-center gap-4">
            <span className="rounded-full border border-base-800 bg-base-900 px-2.5 py-1 text-xs font-medium text-accent">
              {LEVEL_LABEL[level]}
            </span>
            <Link to="/settings" className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs transition hover:bg-accent/30" title="Open settings">U</Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 sm:px-6 sm:py-6 md:pb-6">
          <Outlet />
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-base-800 bg-base-950/95 p-2 backdrop-blur md:hidden">
          {MOBILE_NAV_ITEMS.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return <Link key={item.to} to={item.to} className={`rounded-md px-2 py-2 text-center text-[11px] ${active ? "bg-accent/15 text-accent" : "text-base-100/55"}`}>{item.label}</Link>;
          })}
        </nav>
      </div>
    </div>
  );
}
