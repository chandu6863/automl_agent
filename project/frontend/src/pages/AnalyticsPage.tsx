import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

interface AnalyticsSummary {
  datasets: { total: number; modeled: number };
  experiments: { total: number; completed: number; task_breakdown: Record<string, number> };
  models: { evaluated: number; average_training_time_ms: number; best_model_wins: Record<string, number>; average_primary_score: number | null };
  recent_experiments: Array<{ id: string; task_type: string; target_column: string; status: string; started_at: string; best_model: string | null }>;
}

function Stat({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return <div className="surface rounded-md p-5"><p className="text-xs text-base-100/45">{label}</p><p className="mt-2 font-display text-3xl font-semibold">{value}</p><p className="mt-2 text-xs text-base-100/45">{detail}</p></div>;
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<AnalyticsSummary>("/analytics/summary")
      .then(({ data }) => setSummary(data))
      .catch((err: any) => setError(err?.response?.data?.detail ?? "Could not load analytics."));
  }, []);

  if (error) return <div className="rounded-md bg-status-failed/10 px-4 py-3 text-sm text-status-failed">{error}</div>;
  if (!summary) return <div className="text-sm text-base-100/55">Loading analytics...</div>;

  const modelWins = Object.entries(summary.models.best_model_wins);
  const taskBreakdown = Object.entries(summary.experiments.task_breakdown);

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <p className="eyebrow mb-2">Phase 11 · Evidence</p>
        <h1 className="font-display text-3xl font-semibold">Analytics</h1>
        <p className="mt-2 text-sm text-base-100/55">A quiet view of what you have tried, what performed best, and where to go next.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Datasets" value={summary.datasets.total} detail={`${summary.datasets.modeled} ready for modeling`} />
        <Stat label="Experiments" value={summary.experiments.completed} detail={`${summary.experiments.total} total runs`} />
        <Stat label="Models evaluated" value={summary.models.evaluated} detail={`${summary.models.average_training_time_ms} ms average training`} />
        <Stat label="Primary score" value={summary.models.average_primary_score ?? "-"} detail="Average accuracy, F1, or R2" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="surface rounded-md p-6"><p className="eyebrow mb-4">Best-model wins</p>{modelWins.length === 0 ? <p className="text-sm text-base-100/50">Run an experiment to see model performance here.</p> : <div className="space-y-4">{modelWins.map(([model, wins]) => <div key={model}><div className="flex justify-between text-sm"><span>{model}</span><span className="text-accent">{wins} win{wins === 1 ? "" : "s"}</span></div><div className="mt-2 h-2 rounded-full bg-base-950"><div className="h-2 rounded-full bg-accent" style={{ width: `${Math.min(100, wins / Math.max(...Object.values(summary.models.best_model_wins)) * 100)}%` }} /></div></div>)}</div>}</section>
        <section className="surface rounded-md p-6"><p className="eyebrow mb-4">Task mix</p>{taskBreakdown.length === 0 ? <p className="text-sm text-base-100/50">Classification and regression runs will appear here.</p> : <div className="space-y-3">{taskBreakdown.map(([task, count]) => <div key={task} className="flex items-center justify-between rounded-md border border-base-800 bg-base-950/40 px-4 py-3 text-sm"><span>{task}</span><span className="font-semibold text-accent">{count}</span></div>)}</div>}</section>
      </div>

      <section className="surface rounded-md p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow mb-2">Recent activity</p><h2 className="font-display text-xl font-semibold">Experiment trail</h2></div><Link to="/experiments" className="text-sm text-accent hover:text-accent-muted">View all</Link></div>{summary.recent_experiments.length === 0 ? <p className="mt-6 text-sm text-base-100/50">Your experiment trail will appear here after the first run.</p> : <div className="mt-5 divide-y divide-base-800">{summary.recent_experiments.map((experiment) => <div key={experiment.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"><div><p className="text-sm font-medium">{experiment.best_model ?? "Experiment run"}</p><p className="mt-1 text-xs text-base-100/45">{experiment.task_type} · target: {experiment.target_column}</p></div><div className="text-right"><span className="text-xs text-status-verified">{experiment.status}</span><p className="mt-1 text-xs text-base-100/40">{new Date(experiment.started_at).toLocaleDateString()}</p></div></div>)}</div>}</section>
    </div>
  );
}
