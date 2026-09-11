import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";
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

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const level = useExpertiseStore((s) => s.level);

  async function signOut() {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="flex h-screen bg-base-950 text-base-100">
      <aside className="w-60 shrink-0 border-r border-base-800 flex flex-col">
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 border-b border-base-800 flex items-center justify-between px-6">
          <input
            type="search"
            placeholder="Search datasets, experiments, models..."
            className="w-80 max-w-full rounded-md bg-base-900 border border-base-800 px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-base-900 border border-base-800 text-accent">
              {LEVEL_LABEL[level]}
            </span>
            <button type="button" onClick={signOut} className="h-8 w-8 rounded-full bg-accent/20 text-xs transition hover:bg-accent/30" title="Sign out">U</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
