import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useExpertiseStore } from "../stores/expertiseStore";
import { ExpertiseLevel, User } from "../types";

const LEVELS: { value: ExpertiseLevel; label: string; description: string }[] = [
  { value: "BEGINNER", label: "Guided", description: "Plain-language workflows and automatic choices." },
  { value: "INTERMEDIATE", label: "Assisted", description: "Recommendations with room to adjust the defaults." },
  { value: "EXPERT", label: "Expert", description: "Full technical visibility and configuration control." },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const level = useExpertiseStore((state) => state.level);
  const setLevel = useExpertiseStore((state) => state.setLevel);
  const [user, setUser] = useState<User | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ExpertiseLevel>(level);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<User>("/users/me")
      .then(({ data }) => {
        setUser(data);
        setSelectedLevel(data.expertise_level);
        setLevel(data.expertise_level);
      })
      .catch(() => setError("Could not load your account details."));
  }, [setLevel]);

  async function saveLevel() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const { data } = await api.patch<User>("/users/me/expertise-level", {
        expertise_level: selectedLevel,
      });
      setUser(data);
      setLevel(data.expertise_level);
      setMessage("Your workspace preference has been saved.");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Could not save your preference.");
    } finally {
      setSaving(false);
    }
  }

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
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="eyebrow mb-3">Account control</p>
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
        <p className="mt-2 text-base-100/60">Manage your profile and how the workspace explains machine learning.</p>
      </div>

      {error && <div className="rounded-md bg-status-failed/10 px-4 py-3 text-sm text-status-failed">{error}</div>}
      {message && <div className="rounded-md bg-status-verified/10 px-4 py-3 text-sm text-status-verified">{message}</div>}

      <section className="surface rounded-md p-6">
        <p className="eyebrow mb-4">Profile</p>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent font-display text-lg font-semibold text-base-950">
            {user?.email?.slice(0, 1).toUpperCase() ?? "U"}
          </div>
          <div>
            <h2 className="font-medium">{user?.email ?? "Loading account..."}</h2>
            <p className="mt-1 text-sm text-base-100/50">Account ID: {user?.id ?? "..."}</p>
          </div>
        </div>
      </section>

      <section className="surface rounded-md p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow mb-2">Workspace mode</p>
            <h2 className="font-display text-xl font-semibold">Choose your level of control</h2>
          </div>
          <span className="text-sm text-accent">Level {selectedLevel === "BEGINNER" ? "1" : selectedLevel === "INTERMEDIATE" ? "2" : "3"}</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {LEVELS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedLevel(option.value)}
              className={`rounded-md border p-4 text-left transition ${selectedLevel === option.value ? "border-accent bg-accent/10" : "border-base-800 bg-base-950/40 hover:border-accent/50"}`}
              aria-pressed={selectedLevel === option.value}
            >
              <span className="font-medium">{option.label}</span>
              <span className="mt-2 block text-sm leading-5 text-base-100/55">{option.description}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={saveLevel} disabled={saving || selectedLevel === user?.expertise_level} className="mt-5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base-950 transition hover:bg-accent-muted disabled:cursor-not-allowed disabled:opacity-40">
          {saving ? "Saving..." : "Save preference"}
        </button>
      </section>

      <section className="surface rounded-md border-status-failed/30 p-6">
        <p className="eyebrow mb-2 text-status-failed">Session</p>
        <h2 className="font-display text-xl font-semibold">Sign out of this device</h2>
        <p className="mt-2 text-sm text-base-100/55">Your local access tokens will be removed and you will return to the login screen.</p>
        <button type="button" onClick={signOut} className="mt-5 rounded-md border border-status-failed/50 px-4 py-2 text-sm font-medium text-status-failed transition hover:bg-status-failed/10">
          Sign out
        </button>
      </section>
    </div>
  );
}