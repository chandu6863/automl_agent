import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { AuthResponse } from "../types";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>("/auth/register", { email, password });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      navigate("/onboarding");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-950 text-base-100">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-base-800 bg-base-900 p-8">
        <h1 className="font-display text-xl font-semibold mb-6">Create your account</h1>

        {error && <div className="mb-4 rounded-md bg-status-failed/10 text-status-failed text-sm px-3 py-2">{error}</div>}

        <label className="block text-sm mb-1 text-base-100/70">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 rounded-md bg-base-950 border border-base-800 px-3 py-2 outline-none focus:border-accent"
        />

        <label className="block text-sm mb-1 text-base-100/70">Password</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 rounded-md bg-base-950 border border-base-800 px-3 py-2 outline-none focus:border-accent"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent text-white py-2 font-medium hover:bg-accent-muted disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>

        <p className="mt-4 text-sm text-base-100/60 text-center">
          Already have an account? <Link to="/login" className="text-accent">Log in</Link>
        </p>
      </form>
    </div>
  );
}
